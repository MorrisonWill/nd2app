<script lang="ts">
  import TreeView from './TreeView.svelte'
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'

  const metadata = writable(null)
  const file_name = writable('')
  const file_size = writable('')

  function openFileDialog(): void {
    window.electron.ipcRenderer.send('open-file-dialog')
  }

  onMount(() => {
    window.electron.ipcRenderer.on('file-processed', (_, data) => {
      file_name.set(data.file_name)
      file_size.set(formatFileSize(data.file_size))
      metadata.set(data.metadata)
    })

    window.electron.ipcRenderer.on('file-processed-error', (_, errorMessage) => {
      console.error('Error processing file:', errorMessage)
      // doesn't show an error message to the user
    })

    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('file-processed')
      window.electron.ipcRenderer.removeAllListeners('file-processed-error')
    }
  })

  function formatFileSize(size: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let index = 0
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024
      index++
    }
    return `${size.toFixed(2)} ${units[index]}`
  }

  // function formatMetadata(metadata: string): string {
  //   return JSON.stringify(metadata, null, 2)
  // }
</script>

<main>
  <h1>ND2 Metadata Viewer</h1>
  <div class="control-container">
    <button on:click={openFileDialog}>Select ND2 File</button>
    <span>File Name: {$metadata ? $file_name : 'None selected'}</span>
    <span>File Size: {$metadata ? $file_size : 'None selected'}</span>
  </div>
  <div class="metadata-display-container">
    {#if $metadata}
      <span style="width: 100vw; padding-left: 1em;">Metadata:</span>
      <TreeView data={$metadata} />
    {:else}
      <h3 style="width: 100vw; text-align: center;">No metadata to display</h3>
    {/if}
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    justify-content: space-between;
  }

  h1 {
    margin-top: 2vh;
  }

  .control-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80vw;
    justify-content: space-between;
    height: 8vh;
  }
  .metadata-display-container {
    height: 92vh;
    width: 100vw;
    overflow: scroll;
    margin-top: 2vh;
  }
</style>
