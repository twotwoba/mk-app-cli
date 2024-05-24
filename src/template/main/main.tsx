import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import microApp from '@micro-zoe/micro-app'

import '@/style/preset.css'
import '@/style/tailwind.css'

import RouteList from './router/index.tsx'

const router = createBrowserRouter(RouteList, { basename: import.meta.env.VITE_ROUTER_BASENAME })

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router}></RouterProvider>
    </React.StrictMode>
)

microApp.start()
