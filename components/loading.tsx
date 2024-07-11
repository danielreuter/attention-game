import { ModernLoader } from "./loader/modern-loader";

export function Loading() {
  return (
    <div className='h-screen w-full flex items-center justify-center'>
      <ModernLoader/>
    </div>
  )
}