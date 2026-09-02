import { ChatController } from "./chat.js";
import { MemoryGlobeController } from "./memory-globe.js";
import { elements } from "./ui.js";

new ChatController();
new MemoryGlobeController();

const updateClock = () => { elements.clock.textContent = new Date().toLocaleTimeString("pt-BR"); };
updateClock(); setInterval(updateClock, 1000);
