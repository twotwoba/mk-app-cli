/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import '@/style/preset.css'
import '@/style/tailwind.css'

import RouteList from './router/index.tsx'

const router = createBrowserRouter(RouteList, { basename: import.meta.env.VITE_ROUTER_BASENAME })

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
    <React.StrictMode>
        <RouterProvider router={router}></RouterProvider>
    </React.StrictMode>
)

window.unmount = () => {
    root.unmount()
}
