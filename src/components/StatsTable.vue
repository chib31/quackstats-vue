<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <div class="stats-table">
    <div v-if="resultsExist">
      <b-container fluid="true">
        <b-row cols="1" :cols-md="paginationRequired ? 2 : 1">
          <b-col class="my-1" v-if="paginationRequired">
            <b-pagination v-model="currentPage"
                          :total-rows="filteredDataLength"
                          :per-page="perPage"
                          aria-controls="stats-table"
                          size="sm" pills
                          align="center"
                          class="pt-1 mx-0 my-0 align-bottom"
                          small/>
          </b-col>
          <b-col class="my-1">
            <b-form v-if="tableData && tableData.length > 0" inline class="mb-2 d-flex justify-content-center">
              <b-form-text>Showing</b-form-text>
              <b-form-select v-model="perPage"
                             :options="perPageOptions"
                             class="mx-1 stats-table__per-page-select"
                             size="sm"/>
              <b-form-text>of {{ tableData == null ? 0 : tableData.length }} results</b-form-text>
            </b-form>
          </b-col>
        </b-row>
      </b-container>
      <b-table
        id="stats-table"
        :items="tableData"
        :fields="formattedCols"
        :perPage="perPage"
        :currentPage="currentPage"
        :busy="tableLoading"
        table-class="stats-table__table text-nowrap"
        thead-class="stats-table__header-section"
        tbody-class="stats-table__body-section"
        thead-tr-class="stats-table__header-row"
        tbody-tr-class="stats-table__body-row"
        sticky-header="1000px"
        striped hover no-local-sorting
        class="mt-0 mb-3 text-left">
        <template v-slot:head()="col">
          <div :id="'stats-table-header-' + col.field[labelKey]" class="stats-table__header-div visibleChildOnHover">
            <b-button variant="light"
                      class="stats-table__header-button"
                      :disabled="!col.field['sortType']"
                      @click="clickHeader(col.field)">
              {{ col.field[labelKey] }}
              <span v-if="col.field['sortType'] && col.field['sortPriority']">
                <b-icon-arrow-up :id="col.key + '-sort-asc-icon'" v-if="col.field['sortType'] === 'ASC'"/>
                <b-icon-arrow-down :id="col.key + '-sort-desc-icon'" v-if="col.field['sortType'] === 'DESC'"/>
              </span>
            </b-button>
            <b-button :id="col.key + '-sort-priority'"
                      pill
                      v-if="sortColumnCount > 1 && col.field['sortPriority']"
                      variant="secondary"
                      size="sm"
                      class="stats-table__header-priority"
                      @click="clickExistingPriority(col.field)">
              {{ col.field['sortPriority'] }}
            </b-button>
            <b-button :id="col.key + '-sort-priority-new'"
                      pill
                      variant="outline-secondary"
                      v-if="sortColumnCount > 0 && !col.field['sortPriority'] && col.field['sortType']"
                      size="sm"
                      class="visibleOnHover stats-table__header-priority stats-table__header-priority--new"
                      @click="clickNewPriority(col.field)">
              {{ sortColumnCount + 1 }}
            </b-button>
            <b-button :id="col.key + '-sort-clear-icon'"
                      pill
                      variant="outline-secondary"
                      v-if="col.field['sortType'] && col.field['sortPriority']"
                      size="sm"
                      class="visibleOnHover stats-table__header-clear"
                      @click="clearPriority(col.field)">
              <b-icon-x/>
            </b-button>
          </div>
        </template>
        <template v-slot:table-busy>
          <div id="table-loading-spinner" class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Loading...</strong>
          </div>
        </template>
        <template v-slot:cell(index)="filteredData">
          {{ (filteredData.index + 1) + (perPage * (currentPage - 1)) }}
        </template>
      </b-table>
      <b-container fluid="true">
        <b-row cols="1" :cols-md="paginationRequired ? 2 : 1">
          <b-col class="my-1" v-if="paginationRequired">
            <b-pagination v-model="currentPage"
                          :total-rows="filteredDataLength"
                          :per-page="perPage"
                          aria-controls="stats-table"
                          size="sm" pills
                          align="center"
                          class="pt-1 mx-0 my-0 align-bottom"
                          small/>
          </b-col>
          <b-col class="my-1">
            <b-form v-if="tableData && tableData.length > 0" inline class="mb-2 d-flex justify-content-center">
              <b-form-text>Showing</b-form-text>
              <b-form-select v-model="perPage"
                             :options="perPageOptions"
                             class="mx-1 stats-table__per-page-select"
                             size="sm"/>
              <b-form-text>of {{ tableData == null ? 0 : tableData.length }} results</b-form-text>
            </b-form>
          </b-col>
        </b-row>
      </b-container>
      <hr/>
    </div>
    <div v-if="!resultsExist">
      <b-card text-variant="secondary" class="my-4 mx-auto" align="center">
        <b-card-text>No Results</b-card-text>
      </b-card>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue'

  export default {
    name: "StatsTable",
    props: {
      tableData: {type: Array},
      tableColumns: {type: Array},
      tableLoading: {type: Boolean},
      groupingActive: {type: Boolean},
    },
    data() {
      return {
        currentPage: 1,
        perPage: 50,
        perPageOptions: [
          {value: 20, text: 20},
          {value: 50, text: 50},
          {value: 100, text: 100},
          {value: 99999, text: 'All'}
        ],
      };
    },
    computed: {
      filteredDataLength() {
        return this.tableData == null ? 0 : this.tableData.length;
      },
      resultsExist() {
        return this.filteredDataLength > 0;
      },
      paginationRequired() {
        return (this.filteredDataLength > this.perPage && this.filteredDataLength > 0);
      },
      labelKey() {
        return this.groupingActive ? 'aggLabel' : 'label';
      },
      sortColumnCount() {
        return this.tableColumns.filter(e => e.sortPriority).length;
      },
      formattedCols() {
        return this.tableColumns.map(e => this.applyColCSS(e));
      },
    },
    methods: {
      applyColCSS(col) {
        let headerClass = 'stats-table__th';
        let cellClass = 'stats-table__td';
        if (col['sortPriority'] > 0) {
          headerClass = headerClass.concat(' stats-table__th--sorted');
          cellClass = cellClass.concat(' stats-table__td--sorted');
        }
        Vue.set(col, 'thClass', headerClass);
        Vue.set(col, 'tdClass', cellClass);
        return col;
      },

      // SORTING ACTIONS
      clickHeader(col) {
        this.$emit('clickHeader', col.key);
      },
      clickNewPriority(col) {
        this.$emit('clickNewPriority', col.key);
      },
      clickExistingPriority(col) {
        this.$emit('clickExistingPriority', col.key);
      },
      clearPriority(col) {
        this.$emit('clearPriority', col.key);
      },

      // Formatters for cell data
      "dec2Always"(value) {
        return value === null ? '' : parseFloat(`${value}`).toFixed(2);
      },
      "dec2NoTrail"(value) {
        return value === null ? '' : Math.round((parseFloat(`${value}`) + Number.EPSILON) * 100) / 100;
      },
      "percent1Always"(value) {
        return value === null ? '' : parseFloat(`${value}`).toFixed(1) + '%';
      },
    }
  }
</script>

<style lang="scss">
  @import '../custom';

  $stats-table-header-font-size:  0.9em;
  $stats-table-body-font-size:  0.8em;

  .stats-table {
  
    .stats-table__per-page-select {
      padding-top: 0;
      padding-bottom: 0;
      font-size: 0.8em;
      max-width: 60px;
    }
  
    .stats-table__per-page-select:disabled {
      color: $secondary;
      background-color: $faded-gray;
    }

    .table-striped tbody tr:nth-of-type(odd) {
      background-color: $primary-very-light-t;
    }

    .table-striped tbody tr:hover {
      background-color: $primary-light-t;
    }

    .stats-table__table {
    }

    .stats-table__header-section {
    }

    .stats-table__body-section {
    }

    .stats-table__header-row {
    }

    .stats-table__body-row {
    }

    // Property tbody-class
       .stats-table__tbody {
       }

    // Referenced in column json
       .stats-table__th {
         font-size: $stats-table-header-font-size !important;
         font-weight: bold !important;
         padding: 0.2em !important;
       }

    // Referenced in column json
       .stats-table__th--sorted {
       }

    // Referenced in column json
       .stats-table__td {
         font-size: $stats-table-body-font-size !important;
         padding: 0.2em !important;
       }

    // Referenced in column json
       .stats-table__td--sorted {
         font-weight: bold !important;
       }

    .stats-table__header-div {
      display: inline-block;
      font-size: $stats-table-header-font-size !important;
      font-weight: bold !important;
      padding: 0 !important;
      text-align: left !important;
    }

    .stats-table__header-button {
      font-size: $stats-table-header-font-size !important;
      font-weight: bold !important;
      padding: 0 !important;
      text-align: left !important;
    }

    .stats-table__header-priority {
      font-size: $stats-table-header-font-size !important;
      font-weight: normal !important;
      padding: 0 0.5em 0 0.5em !important;
    }

    .stats-table__header-priority--new {
      margin-left: 0.2em;
    }

    .stats-table__header-clear {
      font-size: $stats-table-header-font-size !important;
      font-weight: normal !important;
      padding: 0 0.1em 0 0.1em !important;
      margin-left: 0.2em;
    }

    .showOnHover {
      display: none;
    }

    .showChildOnHover:hover .showOnHover{
      display: inline-block;
    }

    .visibleOnHover {
      visibility: hidden;
    }

    .visibleChildOnHover:hover .visibleOnHover{
      visibility: visible;
    }
  }
</style>
