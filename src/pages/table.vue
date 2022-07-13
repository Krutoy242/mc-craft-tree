<script setup lang="ts">
import { FilterMatchMode, FilterOperator } from 'primevue/api'
import { copy } from 'copy-anything'
import usePileStore from '~/stores/pile'
import { capitalizeFirstLetter } from '~/assets/lib/utils'
import type { Item } from '~/assets/items/Item'

const { allItems } = usePileStore()

const filtersOpts = {
  'global'        : { value: undefined, matchMode: FilterMatchMode.CONTAINS },
  'display'       : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  'country.name'  : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  'representative': { value: null, matchMode: FilterMatchMode.IN },
  'date'          : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  'balance'       : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  'status'        : { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  'activity'      : { value: null, matchMode: FilterMatchMode.BETWEEN },
  'verified'      : { value: null, matchMode: FilterMatchMode.EQUALS },
}

const filters1 = ref(copy(filtersOpts))

const clearFilter1 = () => {
  filters1.value = copy(filtersOpts)
}

const loading1 = ref(false)

const columns = ref<{
  field?: keyof Item
  is?: string
  header?: string
  get?: (obj: any, v: any) => number
}[]>([
      { field: 'complexity' },
      { field: 'cost' },
      { field: 'processing' },
      { field: 'usability', is: 'GearedNumber' },
      { field: 'inputsAmount', header: 'Inputs', is: 'Hedgehog' },
      { field: 'outputsAmount', header: 'Outputs', is: 'Hedgehog', get: (_, v) => -v },
      { field: 'steps', is: 'EmoteNumber' },
    ])
const selectedColumns = ref(columns.value)
const onToggle = (val: typeof columns.value) => {
  selectedColumns.value = columns.value.filter(col => val.includes(col))
}
</script>

<template>
  <DataTable
    v-model:filters="filters1"
    filter-display="menu"
    :loading="loading1"
    data-key="id"
    :global-filter-fields="['display']"

    state-storage="local"
    state-key="dt-state-demo-local"

    :value="allItems"
    :paginator="true"
    paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"

    :rows="10"
    :rows-per-page-options="[10, 20, 50]"
    current-page-report-template="Showing {first} to {last} of {totalRecords}"
    sort-mode="multiple"
    removable-sort
    responsive-layout="scroll"

    style="width: 100%;"
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
        <BigNumber v-if="!col.is || col.is === 'BigNumber'" :number="col.get?.(data, data[field]) ?? Number(data[field])" />
        <EmoteNumber v-if="col.is === 'EmoteNumber'" :number="col.get?.(data, data[field]) ?? Number(data[field])" />
        <GearedNumber v-if="col.is === 'GearedNumber'" :value="col.get?.(data, data[field]) ?? Number(data[field])" />
        <Hedgehog v-if="col.is === 'Hedgehog'" :value="col.get?.(data, data[field]) ?? Number(data[field])" />
      </template>
    </Column>
  </DataTable>
</template>
