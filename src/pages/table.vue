<script setup lang="ts">
import { FilterMatchMode, FilterOperator } from 'primevue/api'
import usePileStore from '~/stores/pile'

const { allItems } = usePileStore()

const filters1 = ref({
  'global'        : { value: undefined, matchMode: FilterMatchMode.CONTAINS },
  'display'       : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  'country.name'  : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  'representative': { value: null, matchMode: FilterMatchMode.IN },
  'date'          : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  'balance'       : { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  'status'        : { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  'activity'      : { value: null, matchMode: FilterMatchMode.BETWEEN },
  'verified'      : { value: null, matchMode: FilterMatchMode.EQUALS },
})

const initFilters1 = () => {
  filters1.value = {
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
}

const clearFilter1 = () => {
  initFilters1()
}

const loading1 = ref(false)

const columns = ref([
  {
    field : 'complexity',
    header: 'Complexity',
    is    : 'BigNumber',
  },
  {
    field : 'cost',
    header: 'Cost',
    is    : 'BigNumber',
  },
  {
    field : 'processing',
    header: 'Processing',
    is    : 'BigNumber',
  },
  {
    field : 'steps',
    header: 'Steps',
    is    : 'EmoteNumber',
  },
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
      No customers found.
    </template>

    <template #loading>
      Loading customers data. Please wait.
    </template>

    <Column field="display" header="Name" style="min-width:12rem" :sortable="true">
      <template #body="{ data }">
        <Item :item="data" />
      </template>
      <template #filter="{ filterModel }">
        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by name" />
      </template>
    </Column>

    <Column field="display" header="Gear" :sortable="true">
      <template #body="{ data }">
        <GearedNumber :value="Math.round((data.display.length - 15))" inverted />
      </template>
    </Column>

    <Column field="display" header="Hedgehogs" :sortable="true">
      <template #body="{ data }">
        <Hedgehog
          :value="Math.abs(Math.round((data.display.length - 25)))"
          :inverted="(data.display.length - 25) < 0"
        />
      </template>
    </Column>

    <Column field="processing" header="Purity" :sortable="true">
      <template #body="{ data }">
        <PuredValue :purity="Math.min(1.0, Number(data.processing) / 1000000.0)">
          {{ data.recipes?.length }}
        </PuredValue>
      </template>
    </Column>

    <Column
      v-for="(col, index) of selectedColumns"
      :key="`${col.field}_${index}`"
      :field="col.field"
      :header="col.header"
      :sortable="true"
    >
      <template #body="{ data, field }">
        <BigNumber v-if="col.is === 'BigNumber'" :number="Number(data[field])" />
        <EmoteNumber v-else :number="Number(data[field])" />
      </template>
    </Column>
  </DataTable>
</template>
