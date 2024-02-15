<script lang="ts">
  import TreeView from './TreeView.svelte'
  import { writable } from 'svelte/store'

  export let data

  // Each node in the tree can be expanded or collapsed
  const isOpen = writable({})

  // Toggles the open state for a given key
  function toggle(key: string) {
    isOpen.update((state) => ({ ...state, [key]: !state[key] }))
  }

  // Helper function to check if a value is an object
  const isObject = (value: any): boolean =>
    typeof value === 'object' && value !== null
</script>

{#if isObject(data)}
  <ul>
    {#each Object.entries(data) as [key, value]}
      <li>
        <div class="tree-node">
          <button
            class={`toggle ${$isOpen[key] ? 'toggled' : ''}`}
            on:click={() => toggle(key)}
            on:keydown={(event) => {
              if (event.key === 'Enter') toggle(key)
            }}
          >
            {#if $isOpen[key]}
              ▼
            {:else}
              ►
            {/if}
          </button>
          <span class="key">{key}:</span>
          {#if $isOpen[key]}
            {#if isObject(value)}
              <TreeView data={value} />
            {:else}
              {value}
            {/if}
          {/if}
        </div>
      </li>
    {/each}
  </ul>
{:else}
  <div>{data}</div>
{/if}

<style>
  .tree-node {
    margin: 0.5em 0;
    padding-left: 1em;
  }
  .toggle {
    cursor: pointer;
    user-select: none;
    border: 1px solid grey;
    border-radius: 5px;
    height: 3.5vh;
    width: 5vw;
  }
  .toggled {
    background-color: green;
  }
  .key {
    font-weight: bold;
  }
</style>
