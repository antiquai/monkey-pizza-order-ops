'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image";

import "./globals.css";

const SYS_ADMIN = 'admin123'
const WAITER = 'waiter0101'

export default function Home() {
    const [password, setPassword] = useState('')
    const router = useRouter()

    const handleLogin = () => {
        if (password === SYS_ADMIN) {
            router.push('/sys_admin')
        }
        else if (password === WAITER) {
            router.push('/waiter')
        }
    }

    return (
        <div className="flex flex-col gap-4 p-6 w-full h-screen bg-zinc-100 items-center justify-center">
            <div className="flex flex-col items-center gap-6">
               <Image src="/pizza_monkey.svg" alt="logo" width={325} height={325}/> 
                <h1 className="text-4xl font-black tracking-tighter uppercase">Pizza Monkey</h1>
                <p className="text-sm text-zinc-400 uppercase tracking-widest font-medium">
                  Restaurant POS System
                </p>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Eneter role password"
                className="w-full px-4 py-3 border-2 rounded-xl text-sm font-bold outline-none transition-all"
                />
                <button
                onClick={handleLogin}
                className="mt-4 px-12 py-4 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
                >
                Confirm
                </button>
            </div>
        </div>
    )
}