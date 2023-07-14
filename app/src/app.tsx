import { useState } from "react"
import copy from 'copy-to-clipboard'
import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { app } from '@electron/remote'
import OllamaIcon from './ollama.svg'

const ollama = app.isPackaged
? path.join(process.resourcesPath, 'ollama')
: path.resolve(process.cwd(), '..', 'ollama')

function installCLI(callback: () => void) {
  const symlinkPath = '/usr/local/bin/ollama'

  if (fs.existsSync(symlinkPath) && fs.readlinkSync(symlinkPath) === ollama) {
    callback && callback()
    return
  }

  const command = `
    do shell script "ln -F -s ${ollama} /usr/local/bin/ollama" with administrator privileges
  `
  exec(`osascript -e '${command}'`, (error: Error | null, stdout: string, stderr: string) => {
    if (error) {
      console.error(`cli: failed to install cli: ${error.message}`)
      callback && callback()
      return
    }

    console.info(stdout)
    console.error(stderr)
    callback && callback()
  })
}

export default function () {
  const [step, setStep] = useState(0)

  const command = 'ollama run orca'

  return (
    <div className='flex flex-col justify-between mx-auto w-full pt-16 px-4 min-h-screen bg-white'>
      {step === 0 && (
        <>
          <div className="mx-auto text-center">
            <h1 className="mt-4 mb-6 text-2xl tracking-tight text-gray-900">Welcome to Ollama</h1>
            <p className="mx-auto w-[65%] text-sm text-gray-400">
              Let’s get you up and running with your own large language models.
            </p>
            <button
              onClick={() => {
                setStep(1)
              }}
              className='mx-auto w-[40%] rounded-dm my-8 rounded-md bg-black px-4 py-2 text-sm text-white hover:brightness-110'
            >
              Next
            </button>      
          </div>
          <div className="mx-auto">
            <OllamaIcon />
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <div className="flex flex-col space-y-28 mx-auto text-center">
            <h1 className="mt-4 text-2xl tracking-tight text-gray-900">Install the command line</h1>
            <pre className="mx-auto text-4xl text-gray-400">
             &gt; ollama
            </pre>
            <div className="mx-auto">
              <button
                onClick={() => {
                  // install the command line
                  installCLI(() => {
                    window.focus()
                    setStep(2)
                  })
                }}
                className='mx-auto w-[60%] rounded-dm rounded-md bg-black px-4 py-2 text-sm text-white hover:brightness-110'
              >
                Install
              </button>
              <p className="mx-auto w-[70%] text-xs text-gray-400 my-4">
                You will be prompted for administrator access
              </p>
            </div>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div className="flex flex-col space-y-20 mx-auto text-center">
            <h1 className="mt-4 text-2xl tracking-tight text-gray-900">Run your first model</h1>
            <div className="flex flex-col">
              <div className="group relative flex items-center">
                <pre className="text-start w-full language-none rounded-md bg-gray-100 px-4 py-3 text-2xs leading-normal">
                  {command}
                </pre>
                <button
                  className='absolute right-[5px] rounded-md border bg-white/90 px-2 py-2 text-gray-400 opacity-0 backdrop-blur-xl hover:text-gray-600 group-hover:opacity-100'
                  onClick={() => {
                    copy(command)
                  }}
                >
                  <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <p className="mx-auto w-[70%] text-xs text-gray-400 my-4">
                Run this command in your favorite terminal.
              </p>
            </div>
            <button
              onClick={() => {
                window.close()
              }}
              className='mx-auto w-[60%] rounded-dm rounded-md bg-black px-4 py-2 text-sm text-white hover:brightness-110'
            >
              Finish
            </button>
          </div>
        </>
      )}
    </div>

  )
}