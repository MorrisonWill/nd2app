import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import path from 'path'
import axios from 'axios'

import { spawn, ChildProcessWithoutNullStreams } from 'child_process'

let pythonServer: ChildProcessWithoutNullStreams | null = null

function startPythonServer(): void {
  const uvicornCommand = 'uvicorn'
  const args = ['backend:app', '--host', '127.0.0.1', '--port', '8000']
  const options = { cwd: path.join(__dirname, '../../') }

  pythonServer = spawn(uvicornCommand, args, options)

  pythonServer.stdout.on('data', (data) => {
    console.log(`Python Server: ${data}`)
  })

  pythonServer.stderr.on('data', (data) => {
    console.error(`Python Server Error: ${data}`)
  })
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // THIS BIT BELOW ADDED BY ME

  // managing python server

  mainWindow.on('close', () => {
    if (pythonServer) {
      pythonServer.kill('SIGINT')
    }
  })

  // IPC for file upload
  // this is needed because from normal js we can't access the full path of the file
  ipcMain.on('open-file-dialog', (event) => {
    dialog
      .showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'ND2 Files', extensions: ['nd2'] }]
      })
      .then(async (result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0]
          try {
            const response = await axios.post('http://127.0.0.1:8000/process/', {
              file_path: filePath
            })

            console.log('File processed:', response.data)
            event.sender.send('file-processed', response.data)
          } catch (error) {
            if (axios.isAxiosError(error)) {
              const message = error.response?.statusText || error.message
              console.error('Error processing ND2 file:', message)
              event.sender.send('file-processed-error', message)
            } else {
              console.error('Error processing ND2 file:', error)
              event.sender.send('file-processed-error', 'An unknown error occurred')
            }
          }
        }
      })
      .catch((err) => {
        console.log(err)
      })
  })

  startPythonServer()

  // END OF MY ADDITIONS

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
