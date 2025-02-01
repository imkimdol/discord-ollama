import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import CommandsClient from '../commandsClient';
import ollama from 'ollama';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the language model.')
        .addStringOption(option =>
            option.setName('question').setDescription('The question to ask.').setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, client: CommandsClient) {
        await interaction.deferReply();

        try {
            const model = process.env.MODEL;
            if (!model) return interaction.editReply('No specified model name.');

            const question = interaction.options.getString('question');
            if (question == null) throw new Error('Question is null!');

            const reply = await interaction.editReply('Model is starting...');

            const responseIterator = await ollama.chat({
                model: model,
                messages: [{ role: 'user', content: question }],
                stream: true,
                keep_alive: '6h'
            });

            let partial = '';
            let count = 0;
            for await (const partialResponse of responseIterator) {
                partial += partialResponse.message.content;
                count++;
                if (count > 5) {
                    reply.edit(partial);
                    count = 0;
                }
            }
            reply.edit(partial);
        } catch (err) {
            console.error(err);
        }
    },
};