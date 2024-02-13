<script lang="ts">
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'

  const metadata = writable('')

  function openFileDialog(): void {
    window.electron.ipcRenderer.send('open-file-dialog')
  }

  onMount(() => {
    window.electron.ipcRenderer.on('file-processed', (_, data) => {
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
</script>

<button on:click={openFileDialog}>Select ND2 File</button>

{#if $metadata}
  <div>Metadata: {JSON.stringify($metadata)}</div>
{:else}
  <div>No metadata to display</div>
{/if}
