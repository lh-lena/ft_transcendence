import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

export async function generateProfileSummary(): Promise<string> {
  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    instructions: `
        You are a summary tool agent designed for a student (ecole 42 transendence pong project. 
        You will receive some stats and data about each player profile.
        Your summary will reside on the profile page of the player.
        Based on the data provide 2 sentenced (always 3) highlighting their strengths or weaknesses as a player. Very little text pls.
        Always use "you" not they.
        Please do so in a fun playful way.
        `,
    input: 'Player: Mo. Highscore 21. Favorite game mode: tournament',
  });

  console.log(response.output_text);
  return response.output_text;
}
