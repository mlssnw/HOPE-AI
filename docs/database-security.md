# Segurança e operação do PostgreSQL

Este documento descreve a configuração preparada pelo código. Ele não registra uma
alteração já aplicada no provedor gerenciado. Substitua todos os valores entre
`<...>` antes de usar os exemplos e execute-os somente com uma credencial
administrativa, em uma janela controlada.

## Separação de credenciais

- `DATABASE_URL`: role dedicada usada pelo processo web. Ela deve fazer apenas DML
  nas tabelas da aplicação e não pode criar roles, bancos, schemas ou ignorar RLS.
- `DATABASE_ADMIN_URL`: opcional, usada exclusivamente pelo Alembic e por operação
  autorizada. O servidor web não lê essa variável para abrir seu pool.
- Se `DATABASE_ADMIN_URL` estiver ausente, o Alembic usa `DATABASE_URL` por
  compatibilidade. Esse fallback é adequado a desenvolvimento, não ao desenho de
  produção.

Modelo SQL para o administrador adaptar:

```sql
CREATE ROLE hope_runtime
  LOGIN
  PASSWORD '<senha-runtime-gerada-no-secret-manager>'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOBYPASSRLS;

GRANT CONNECT ON DATABASE <nome_do_banco> TO hope_runtime;
GRANT USAGE ON SCHEMA <schema_da_aplicacao> TO hope_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA <schema_da_aplicacao>
  TO hope_runtime;
GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA <schema_da_aplicacao>
  TO hope_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE <proprietario_das_migrations>
  IN SCHEMA <schema_da_aplicacao>
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hope_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE <proprietario_das_migrations>
  IN SCHEMA <schema_da_aplicacao>
  GRANT USAGE, SELECT ON SEQUENCES TO hope_runtime;

REVOKE CREATE ON SCHEMA <schema_da_aplicacao> FROM hope_runtime;
```

Confirme os privilégios resultantes antes de trocar `DATABASE_URL`. A role de
runtime não deve receber `TRUNCATE`, DDL, ownership das tabelas nem associação a
uma role com `BYPASSRLS`. Guarde ambas as URLs no gerenciador de secrets; nunca no
frontend, Git, logs ou documentação preenchida.

## Migration `20260903_0003`

A migration acrescenta somente garantias estruturais e não remove entidades
órfãs nem outros dados:

- unicidade da identidade normalizada de entidades por usuário;
- chaves únicas auxiliares `(user_id, id)` em memórias e entidades;
- FKs compostas que impedem vínculos, fontes, eventos e relações entre usuários;
- limites para importância, confiança, peso emocional, pesos de relações e
  contadores;
- rejeição de conteúdo de memória vazio e autorrelações.

Antes de aplicar em qualquer ambiente, execute as consultas de pré-validação do
plano de implantação e faça backup. O audit de 3 de setembro de 2026 encontrou os
dados atuais compatíveis, mas isso não substitui a validação imediatamente antes
da migration. Não execute downgrade em produção apenas para testar reversão.

O RLS permanece preparado, mas adiado: habilitá-lo corretamente depende de uma
identidade autenticada e de um `user_id` definido pelo servidor em cada transação.
As FKs compostas protegem a integridade das escritas, mas não substituem uma
política de leitura. Antes de exposição pública multiusuário, implemente a camada
de autenticação/autorização e então habilite/teste políticas RLS com uma role sem
`BYPASSRLS`.

## Orçamento de conexões

Os padrões conservadores são:

```text
DB_POOL_SIZE=3
DB_MAX_OVERFLOW=1
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=900
```

O teto teórico da aplicação é:

```text
workers × (DB_POOL_SIZE + DB_MAX_OVERFLOW)
```

Some também conexões de migrations, observabilidade, console administrativo e
manutenção. Para um servidor com 20 conexões, quatro workers com os padrões podem
usar até 16 conexões; isso deixa somente quatro para administração. Reduza workers
ou pools quando essa reserva não for suficiente. Meça uso e espera do pool antes
de elevar qualquer valor.

## Embeddings e busca vetorial

`LocalHashEmbeddingProvider` é deliberadamente limitado a desenvolvimento e
testes. `APP_ENVIRONMENT=production`, `prod` ou `staging` faz o startup recusar
`EMBEDDING_PROVIDER=local-hash`. Um adapter semântico real e uma avaliação
controlada de recall, latência, plano de execução e uso do HNSW ainda são
necessários antes de certificar a busca vetorial de produção.

## Observabilidade sem vazamento

- mantenha `DATABASE_ECHO=false` fora de diagnóstico local;
- parâmetros SQL ficam ocultos pelo engine mesmo quando o echo é habilitado;
- registre duração, operação, tabela/componente, contagem de linhas e um ID de
  correlação, nunca texto de memória, embeddings, senhas ou URLs completas;
- colete ocupação do pool, timeouts, erros, latência e consultas lentas com acesso
  restrito e retenção definida;
- habilitar extensões ou opções do PostgreSQL gerenciado exige avaliação e ação do
  responsável pela infraestrutura; o código não altera o serviço Aiven.

## Sequência segura de implantação

1. Criar e validar a role de runtime com o modelo acima.
2. Preparar banco descartável ou clone sanitizado e configurar
   `DATABASE_ADMIN_URL` apenas no processo de migration.
3. Pré-validar duplicatas, faixas numéricas e referências cruzadas.
4. Gerar e revisar `alembic upgrade head --sql`.
5. Aplicar `alembic upgrade head` no ambiente descartável.
6. Executar `alembic check`, `scripts/preflight_database.py` e a suíte completa.
7. Trocar `DATABASE_URL` para a role de runtime e testar DML permitido e DDL
   negado.
8. Só então planejar produção, com backup, janela, rollback operacional e
   aprovação explícita.
