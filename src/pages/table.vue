<script setup lang="ts">
import { FilterMatchMode, FilterOperator } from 'primevue/api'
import { copy } from 'copy-anything'
import { capitalize } from 'lodash'
import usePileStore from '~/stores/pile'
import { capitalizeFirstLetter } from '~/assets/lib/utils'
import type { Item } from '~/assets/items/Item'

const pile = usePileStore()
const { pickedItems, selectRecipes } = pile

const filtersOpts = {
  global : { value: undefined, matchMode: FilterMatchMode.CONTAINS },
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

const clearFilter1 = () => {
  filters1.value = copy(filtersOpts)
}

const loading1 = ref(false)

interface ColumnOpts {
  field: keyof Item
  is: string
  header: string
  get: (obj: any, v: any) => number
}

const columns = $ref<ColumnOpts[]>([])

function regColumn(opts: Partial<ColumnOpts>) {
  const field = (opts.field ?? opts.header?.toLocaleLowerCase() ?? 'Undef_field') as keyof Item
  columns.push({
    field,
    header: opts.header ?? capitalize(field),
    is    : opts.is ?? 'BigNumber',
    get   : opts.get ?? ((obj: Item, v: any) => v),
  })
}

regColumn({ field: 'complexity' })
regColumn({ field: 'cost' })
regColumn({ field: 'processing' })
regColumn({ field: 'usability' })
regColumn({ field: 'popularity', is: 'GearedNumber' })
regColumn({ field: 'inputsAmount', header: 'Inputs', is: 'Hedgehog' })
regColumn({ field: 'outputsAmount', header: 'Outputs', is: 'Hedgehog', get: (_, v) => -v })
regColumn({ field: 'steps', is: 'EmoteNumber' })

let selectedColumns = $ref(columns)

const onToggle = (val: typeof columns) => {
  selectedColumns = columns.filter(col => val.includes(col))
}
</script>

<template>
  <!-- sort-mode="multiple" -->
  <DataTable
    v-model:filters="filters1"
    filter-display="menu"
    :global-filter-fields="['display']"
    removable-sort
    :loading="loading1"
    data-key="id"

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

    @row-click="(e) => selectRecipes([e.data.mainRecipe])"
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

    <Column field="display" header="Name" style="min-width:12rem" :sortable="true">
      <template #body="{ data }">
        <Item :item="data" />
      </template>
      <template #filter="{ filterModel }">
        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by name" />
      </template>
    </Column>

    <Column
      v-for="(col, index) of selectedColumns"
      :key="`${col.field}_${index}`"
      :field="col.field"
      :header="col.header ?? capitalizeFirstLetter(col.field ?? 'unknown')"
      :sortable="true"
    >
      <template #body="{ data, field }">
        <BigNumber v-if="col.is === 'BigNumber'" :number="col.get(data, data[field])" />
        <EmoteNumber v-if="col.is === 'EmoteNumber'" :number="col.get(data, data[field])" />
        <GearedNumber v-if="col.is === 'GearedNumber'" :value="col.get(data, data[field])" />
        <Hedgehog v-if="col.is === 'Hedgehog'" :value="col.get(data, data[field])" />
      </template>
    </Column>
  </DataTable>
</template>
