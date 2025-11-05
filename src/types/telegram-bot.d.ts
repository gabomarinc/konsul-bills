// Declaración de tipos para node-telegram-bot-api
declare module 'node-telegram-bot-api' {
  interface TelegramBotOptions {
    polling?: boolean;
    webHook?: boolean;
    [key: string]: any;
  }

  class TelegramBot {
    constructor(token: string, options?: TelegramBotOptions);
    sendMessage(chatId: number | string, text: string, options?: any): Promise<any>;
    [key: string]: any;
  }

  export = TelegramBot;
  export default TelegramBot;
}

