const App = () => {
    return (
        <div className="flex flex-col justify-center items-center h-full px-52 bg-[#1B1B1F]">
            <div className="self-start mb-56 text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Hi, young fella
            </div>
            {/* <p className="text-white">Main App</p> */}
            <p className="text-white bg-[#646cff] px-4 py-2 rounded-md">Your first Sub App</p>
            <p className="text-white">↓↓↓</p>
            <div className="w-10/12 h-1/3 p-5 border border-dashed border-slate-50 rounded-md">
                <micro-app name="sub" url="http://localhost:7789/" iframe>
                    <div className="text-white">
                        <div className="mb-10 text-center">Oops~</div>
                        <div className="mb-12">Please create your first sub app and run it.</div>
                        <li>{' mk web <sub app>'}</li>
                        <li>{' cd <sub app>'}</li>
                        <li>{' pnpm i'}</li>
                        <li>{' pnpm run dev'}</li>
                    </div>
                </micro-app>
            </div>
        </div>
    )
}

export default App
