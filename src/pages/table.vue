<!-- eslint-disable vue/singleline-html-element-content-newline -->

<script setup lang="ts">
import { FilterMatchMode, FilterOperator } from 'primevue/api'
import { copy } from 'copy-anything'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import usePileStore from '~/stores/pile'
import type { Item } from '~/assets/items/Item'
import type { Recipe } from '~/assets/items/Recipe'

const pile = usePileStore()
const { selectRecipes } = pile
const pickedItems = storeToRefs(pile).pickedItems as Ref<Item[]>
const allRecipes = storeToRefs(pile).allRecipes as Ref<Recipe[]>
const target = storeToRefs(pile).target as Ref<{ item?: Item, isTo?: boolean } | undefined>

const filtersOpts = {
  global: { value: undefined, matchMode: FilterMatchMode.CONTAINS },
  display: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  // 'country.name'  : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  // 'representative': { value: null, matchMode: FilterMatchMode.IN },
  // 'date'          : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  // 'balance'       : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  // 'status'        : { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  // 'activity'      : { value: null, matchMode: FilterMatchMode.BETWEEN },
  // 'verified'      : { value: null, matchMode: FilterMatchMode.EQUALS },
}

const filters1 = ref(copy(filtersOpts))

function clearFilter1() {
  filters1.value = copy(filtersOpts)
}

const columns = $ref([
// { header: 'Name' },
  { header: 'Complexity' },
  { header: 'Cost' },
  { header: 'Processing' },
  { header: 'Usability' },
  { header: 'Popularity' },
  { header: 'Inputs' },
  { header: 'Outputs' },
  { header: 'Steps' },
])
let selectedColumns = $ref(columns)

function onToggle(val: typeof columns) {
  selectedColumns = columns.filter(col => val.includes(col))
}

const exampleItems = computed(() => [
  pickedItems.value.find(it => !!it.sNbt && it.source !== 'fluid'),
  pickedItems.value.find(it => it.source === 'fluid'),
  pickedItems.value.find(it => it.source === 'gas' && it.usability > 0),
] as Item[])

const exampleRecipe = computed(() => allRecipes.value?.find(r =>
  r.catalysts?.[0]?.it.items.some(t => t.id === 'minecraft:furnace:0'),
))

/*
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗    ███╗   ███╗███████╗███╗   ██╗██╗   ██╗
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝    ████╗ ████║██╔════╝████╗  ██║██║   ██║
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║       ██╔████╔██║█████╗  ██╔██╗ ██║██║   ██║
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║       ██║╚██╔╝██║██╔══╝  ██║╚██╗██║██║   ██║
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║       ██║ ╚═╝ ██║███████╗██║ ╚████║╚██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝       ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝
*/

const cm = ref()
const selectedRow = $shallowRef<Item>()
const onRowContextMenu = (event: any) => cm.value.show(event.originalEvent)
const menuModel = ref([
  { label: 'Build tree to', icon: 'pi pi-sort-amount-up-alt', command: () => pile.pileTo(selectedRow) },
])
</script>

<template>
  <!-- sort-mode="multiple" -->
  <div>
    <DataTable
      v-model:filters="filters1"
      v-model:contextMenuSelection="selectedRow"
      class="p-datatable-sm"
      filter-display="menu"
      :global-filter-fields="['display']"
      removable-sort
      :loading="!pickedItems?.length"

      data-key="id"
      context-menu
      state-storage="local"
      state-key="dt-state-demo-local"

      :value="pickedItems"
      :paginator="true"
      paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"

      :rows="10"
      :rows-per-page-options="[10, 20, 50]"
      current-page-report-template="Showing {first} to {last} of {totalRecords}"
      responsive-layout="scroll"

      style="width: 100%;"

      @row-contextmenu="onRowContextMenu"
    >
      <template #header>
        <div class="flex justify-content-between">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="filters1.global.value" placeholder="Keyword Search" />
          </span>
          <Button type="button" icon="pi pi-filter-slash" label="Clear" class="p-button-outlined" @click="clearFilter1()" />
          <div style="text-align:left">
            <MultiSelect
              :model-value="selectedColumns"
              :options="columns"
              option-label="header"
              placeholder="Select Columns"
              @update:model-value="onToggle"
            />
          </div>
        </div>
      </template>

      <template #empty>
        No items found.
      </template>

      <template #loading>
        Loading items data. Please wait.
      </template>

      <Column field="display" style="min-width:12rem" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1> Name </h1>
            </template>
            <template #help>
              <ItemIcon v-for="it in exampleItems" :key="it.id" :item="it" class="inline-block" />
              <p><strong>Item</strong>, <strong>Liquid</strong>, <strong>Gas</strong> or other object that <i>can be used in crafts</i>.</p><br>
              <p><BaseID :value="exampleItems[0]?.id ?? ''" /> ID is the <strong>mod</strong>, <strong>entry</strong> and <strong>metadata</strong>, if any.</p><br>
              <p>If the item has an NBT tag, it will be marked as <code>{…}</code>. Hover over the line to see the tag in full.</p>
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <ItemSimple :item="data" class="shadow-3" />
        </template>
        <template #filter="{ filterModel }">
          <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by name" />
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Complexity')" field="complexity" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1> Complexity </h1>
            </template>
            <template #help>
              <p><strong class="val-complexity">Complexity</strong> is figurative "item complexity", something between <span class="text-purple-600">UU-price</span> or <span class="text-pink-600">EMC</span>.</p><br>
              <p>Roughly speaking, it's "the number of ticks it takes to craft the first such item".</p><br>
              <p>It is calculated by the formula <span class="bg-black-alpha-20 px-1 monospace"><strong class="val-cost">Cost</strong> + <strong class="val-processing">Processing</strong></span>.</p><br>
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <BigNumber :number="data.complexity" class="hard-shadow px-1 border-round" />
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Cost')" field="cost" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1>Cost</h1>
            </template>
            <template #help>
              <p>The price of <span class="val-input">input</span> items without regard to the <span class="val-complexity">complexity</span> of <span class="val-processing">processing</span></p>
              <br>
              <p>For example, <MCFont value="Sticks" /> can be made from <MCFont value="Planks" /> right in your hands, making zero processing <span class="val-complexity">complexity</span>.</p>
              <p>If the <MCFont value="Planks" /> are thrown into a high-powered industrial <MCFont value="Sawmill" />, however, their <span class="val-cost">cost</span> will be less, but the <span class="val-complexity">complexity</span> of <span class="val-processing">processing</span> will increase.</p>
              <br>
              <p>ALso, each recipe adds 1 to the <span class="val-cost">cost</span>, even if the recipe is free.</p>
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <BigNumber :number="data.cost" />
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Processing')" field="processing" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1> Processing </h1>
            </template>
            <template #help>
              <p><span class="val-processing">Processing</span> is the total <span class="val-cost">cost</span> of all <span class="val-catalyst">catalysts</span> in all <span class="val-step">steps</span>.</p>
              <br>
              <p>In other words, it is the <span class="val-cost">cost</span> of your base - the <span class="val-cost">cost</span> of all the machines and tools you used to get to that item.</p>
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <BigNumber :number="data.processing" />
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Usability')" field="usability" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1> Usability </h1>
            </template>
            <template #help>
              <p><strong class="val-usability">Usability</strong> is the total number of items you need to craft the <strong>target item</strong>.</p>
              <p>Currently <strong>target item</strong> is:</p>
              <ItemSimple :item="target?.item" />
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <BigNumber :number="data.usability" />
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Popularity')" field="popularity" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1>Popularity</h1>
            </template>
            <template #help>
              <p><strong class="text-orange-500">Popularity</strong> is the number of recipes in which this item was used as a <strong>catalyst</strong>.</p><br>
              <p>A <strong>catalyst</strong> is a machine or multiblock that you use to craft, but it does not spend.</p><br>
              <p>For example, Furnace is the catalyst in this recipe:</p>
              <CRecipe :recipe="exampleRecipe" />
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <div class="flex justify-content-center">
            <Button
              v-if="data.popularity"
              class="p-button-raised p-button-text p-button-warning px-4 py-2 m-0"
              @click="() => selectRecipes([...data.popList])"
            >
              <GearedNumber :value="data.popularity" />
            </Button>
            <p v-else>
              -
            </p>
          </div>
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Inputs')" field="inputsAmount" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1>Inputs</h1>
            </template>
            <template #help>
              <p>The number of items required in the <strong>main recipe</strong>.</p><br>
              <p>One item can have many recipes, but only <strong>the cheapest</strong> will be considered "main".</p><br>
              <p>The "cheapest" is the recipe with the lowest <span class="val-complexity">complexity</span> value.</p><br>
              <p>Click the button to show this recipe</p>
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <div class="flex justify-content-center">
            <Button
              v-if="data.inputsAmount"
              class="p-button-raised p-button-text p-button-success px-4 py-2 m-0"
              @click="() => selectRecipes([...data.recipes], data.mainRecipe)"
            >
              <Hedgehog :value="data.inputsAmount" />
            </Button>
            <p v-else>
              -
            </p>
          </div>
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Outputs')" field="outputsAmount" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1>Outputs</h1>
            </template>
            <template #help>
              <p>The number of recipes where this item is used as an <span class="val-input">input</span>.</p><br>
              <p>This lists only those recipes that are used in the tree before the <strong>target item</strong></p>
              <p>Currently <strong>target item</strong> is:</p>
              <ItemSimple :item="target?.item" />
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <div class="flex justify-content-center">
            <Button
              v-if="data.outputsAmount"
              class="p-button-raised p-button-text p-button-info px-4 py-2 m-0"
              @click="() => selectRecipes([...data.usedInRecipes])"
            >
              <Hedgehog :value="-data.outputsAmount" />
            </Button>
            <p v-else>
              -
            </p>
          </div>
        </template>
      </Column>

      <Column v-if="selectedColumns.find(c => c.header === 'Steps')" field="steps" :sortable="true">
        <template #header>
          <QuestionMark>
            <template #body>
              <h1>Steps</h1>
            </template>
            <template #help>
              <p>The number of <span class="val-recipe">recipes</span> you need to go through to craft this item.</p><br>
              <p>If there is no number, the price of this item is set manually, without calculation.</p>
            </template>
          </QuestionMark>
        </template>
        <template #body="{ data }">
          <EmoteNumber :number="data.steps" />
        </template>
      </Column>
    </DataTable>

    <ContextMenu ref="cm" :model="menuModel" />
  </div>
</template>

<style>
.p-datatable .p-column-header-content {
  justify-content: flex-end
}

.p-column-header-content h1 {
  display: inline-block;
}

td:nth-child(2) {
  border-width: 0 1px 1px 1px!important;
}

.hard-shadow {
  box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.16), 0px 3px 4px rgba(0, 0, 0, 0.2), 0px 1px 4px -1px rgba(0, 0, 0, 0.2);
}
</style>
