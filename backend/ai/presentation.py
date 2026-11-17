from __future__ import annotations

from ..models import PresentationMode


PRESENTATION_INSTRUCTIONS: dict[PresentationMode, str] = {
    PresentationMode.FOCUS: (
        "Comece pela análise substantiva: diagnóstico, evidência, restrição ou ação. "
        "Seja direta e concisa. Não acrescente saudação ritual, frase de modo ou humor "
        "automático. Segurança, verdade, incerteza e confirmações continuam prioritárias."
    ),
    PresentationMode.SUPPORTIVE: (
        "Mantenha uma abordagem direta, analítica e não terapêutica. Reduza a carga "
        "cognitiva com passos concretos sem inferir emoção, infantilizar ou assumir "
        "responsabilidade pela pessoa. Segurança, verdade e precisão prevalecem."
    ),
    PresentationMode.PRESENTATION: (
        "Organize a explicação substantiva com estrutura clara, transições breves e "
        "hierarquia legível. Não transforme a resposta em performance nem omita riscos, "
        "limites, incerteza, confirmações ou consequências materiais."
    ),
}


def presentation_section(mode: PresentationMode) -> str:
    instruction = PRESENTATION_INSTRUCTIONS.get(mode)
    if instruction is None:
        return ""
    section = f"[TURN PRESENTATION]\n{instruction}"
    if len(section) > 1000:  # Defensive invariant for future static edits.
        raise ValueError("Turn presentation section exceeds 1,000 characters.")
    return section
