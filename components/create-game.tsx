"use client"

import { createGame } from "@/lib/game/actions";
import { game } from "@/lib/types"
import { z } from "zod"
import { Button } from "./ui/button";

export function CreateGame({ games }: { games: z.infer<typeof game>[] }) {
  return (
    <form 
      className='w-full min-h-screen flex-col flex p-14'
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const setup = { 
          subject: formData.get('subject') as string,
          sentence: formData.get('sentence') as string
        }
        console.log(setup)
        createGame(setup);
      }}
    >
      {games.map((game) => (
        <div className='flex flex-col px-8 py-2' key={game.id}>
          <h2 className='text-xl font-semibold'>{game.subject}</h2>
          <p className='text-sm font-light'>{game.sentence}</p>
        </div>  
      ))} 
      <div className='pt-14 w-full flex-col flex gap-4'>
        <input 
          name="subject" 
          type="text"
          placeholder="Subject"
        />
        <input 
          name="sentence" 
          type="text"
          placeholder="Sentence"
        />  
        <Button type="submit">Create Game</Button>
      </div>
    </form>
  )
}