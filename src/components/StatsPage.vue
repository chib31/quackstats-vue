<template>
  <div class="stats-page">
    <b-button-toolbar class="mb-1 mx-2">
      <b-container fluid="true" class="m-0 p-0">
        <b-row cols="1" cols-md="2">
          <b-col cols="12" md="auto">
            <h1 class="display-4"> {{ toTitleCase(statType) + ' Stats' }} </h1>
          </b-col>
          <b-col class="d-flex justify-content-start px-0 pb-1">
            <b-dropdown text="Group By" variant="light" class="mx-1 mt-auto" menu-class="text-nowrap"
                        v-if="resultsFound">
              <b-dropdown-form>
                <b-checkbox switch v-for="col of colsBase.filter(e => e.groupable)" :key="col.key" v-model="col.grouped">
                  {{col.label}}
                </b-checkbox>
              </b-dropdown-form>
            </b-dropdown>
            <b-dropdown text="Choose Columns" variant="light" class="mx-1 mt-auto" menu-class="text-nowrap"
                        v-if="resultsFound">
              <b-dropdown-form>
                <b-checkbox switch v-for="col of colsGrouped.filter(e => e[currentViewabilityKey] === 'OPTIONAL')"
                            :key="col.key" v-model="col[currentDisplayKey]">
                  {{col[currentLabelKey]}}
                </b-checkbox>
              </b-dropdown-form>
            </b-dropdown>
            <b-button :pressed.sync="showFilters" variant="light" class="mx-1 mt-auto" v-if="resultsFound">
              Filter
            </b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-button-toolbar>
    <transition name="slide-fade">
      <div v-if="showFilters" class="mb-3 mx-2 mt-3">
        <b-container fluid="true" class="px-4">
          <b-row cols="1" cols-md="2" cols-xl="3">
            <b-col v-for="col of colsBase.filter(e => e.filterable)" :key="col.key" class="px-1 mb-1">
              <b-form-group :label="col.label" label-cols="3" label-class="pt-2 pr-1 text-right stats-page__filter-label">
                <multiselect v-model="col.selectFilters"
                             class="multiselect"
                             :taggable="true"
                             :options="uniqueValues(dataBase, col)"
                             :multiple="true"
                             :close-on-select="true"
                             :clear-on-select="false"
                             :preserve-search="true"
                             placeholder="All"
                             label='value'
                             track-by='value'
                             :select-label="null"
                             :deselect-label="null"
                             :hideSelected="true"
                             :preselect-first="false">
                </multiselect>
              </b-form-group>
            </b-col>
          </b-row>
          <hr class="mt-1" v-if="validRangeCols.length > 0"/>
          <b-row cols="1" cols-md="2" cols-xl="3">
            <b-col v-for="col of validRangeCols" :key="col.key" class="px-1">
              <b-form-group :label="col[currentLabelKey]" label-cols="3"
                            label-class="text-right pr-0 mb-1 stats-page__filter-label">
                <b-container class="pt-1">
                  <b-row>
                    <b-col class="text-right text-muted pl-0 pr-2 py-1 stats-page__filter-label">
                      <span>{{ Math.round(col.filterRange[0]) }}</span>
                    </b-col>
                    <b-col cols="9">
                      <div class="pt-2">
                        <nouislider :key="col.filterRange[0]" :config="col.filterConfig" :values="col.filterRange"/>
                      </div>
                    </b-col>
                    <b-col class="text-left text-muted pr-0 pl-2 py-1 stats-page__filter-label">
                      <span>{{ Math.round(col.filterRange[1]) }}</span>
                    </b-col>
                  </b-row>
                </b-container>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </div>
    </transition>
    <hr class="p-0 m-0 pb-2"/>
    <b-form v-if="resultsFound" inline class="mb-2 d-flex justify-content-center">
      <b-form-text>Showing</b-form-text>
      <b-form-select v-model="perPage" :options="perPageOptions" class="mx-1 stats-page__per-page-select" style="max-width: 60px" size="sm"/>
      <b-form-text>of {{ dataFinal == null ? 0 : dataFinal.length }} results</b-form-text>
    </b-form>
    <stats-table
      v-if="resultsFound && !tableLoading"
      :table-data="dataFinal"
      :table-columns="colsDisplayed"
      :table-loading="tableLoading"
      :grouping-active="groupingActive"
      :per-page="perPage"
      v-on:clickHeader="clickHeader"
      v-on:clickNewPriority="clickNewPriority"
      v-on:clickExistingPriority="clickExistingPriority"
      v-on:clearPriority="clearPriority"/>
    <div v-if="!resultsFound || tableLoading" class="d-flex justify-content-center my-4">
      <b-spinner v-if="tableLoading" variant="primary" label="Loading..."/>
      <div v-if="!tableLoading">
        <h4 class="text-secondary">No data found</h4>
        <div class="d-flex justify-content-center">
          <b-button v-on:click="fetchData" variant="outline-secondary" pill size="lg"><b-icon-arrow-repeat/></b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue'
  import axios from 'axios'
  import StatsTable from "./StatsTable";
  import {Utils} from "../utils";
  import config from "../config";
  import {mean, sum} from 'd3-array';
  import Nouislider from 'vue-nouislider/src/components/noUiSlider';
  import {uniqBy, cloneDeep} from "lodash";
  import Multiselect from 'vue-multiselect'
  import * as sg from 'supergroup';

  export default {
    components: {
      StatsTable,
      Nouislider,
      Multiselect
    },
    props: {
      statType: null,
    },
    data() {
      return {
        reportInfo: {},
        tableLoading: false,
        showFilters: false,
        currentPage: 1,
        perPage: 50,
        perPageOptions: [
          {value: 20, text: 20},
          {value: 50, text: 50},
          {value: 100, text: 100},
          {value: 99999, text: 'All'}
        ],
        colsRaw: [],
        colsBase: [],
        colsGrouped: [],
        dataRaw: [],
        dataBase: [],
        dataProcessed: [],
        dataSorted: [],
        dataFinal: [],
      };
    },
    mixins: [Utils],
    mounted() {
      this.fetchData();
    },
    computed: {
      groupingActive() {
        return this.colsBase.filter(e => e.grouped).length > 0;
      },
      currentViewabilityKey() {
        return this.groupingActive ? 'aggViewability' : 'viewability';
      },
      currentLabelKey() {
        return this.groupingActive ? 'aggLabel' : 'label';
      },
      currentRangeableKey() {
        return this.groupingActive ? 'aggRangeable' : 'rangeable';
      },
      currentDisplayKey() {
        return this.groupingActive ? 'aggDisplay' : 'display';
      },
      resultsFound() {
        return this.dataBase && this.dataBase.length > 0;
      },

      // COLUMN SETS
      filterCols() {
        // The columns with filters directly applied
        return this.colsBase.filter(e => e.selectFilters && e.selectFilters.length > 0);
      },
      groupedCols() {
        // The columns with grouping flags directly applied
        return this.colsBase.filter(e => e.grouped);
      },
      sortCols() {
        // The columns with sort priorities directly applied
        return this.colsGrouped.filter(e => e.sortPriority > 0)
          .sort((a, b) => a.sortPriority - b.sortPriority);
      },
      rangeCols() {
        // The columns with range filters directly applied
        return this.colsGrouped.filter(e => e[this.currentRangeableKey]);
      },
      validRangeCols() {
        // Columns with valid range limits (i.e. min < max)
        return this.rangeCols.filter(e => e.filterConfig.range.min < e.filterConfig.range.max);
      },

      // **************************************************************************************************************
      // WATCHER TARGETS - only exist as lightweight 'summaries' for watchers, to avoid deep watching
      "filterWatcherTarget"() {
        return this.filterCols.map(e => e.key + ':[' + e.selectFilters.map(e => e.value).join(',') + ']').join(', ');
      },
      "groupedWatcherTarget"() {
        return this.groupedCols.map(e => e.key).join(',');
      },
      "sortWatcherTarget"() {
        return this.sortCols.map(e => e.key + ':' + e.sortPriority + '(' + e.sortType + ')').join(', ');
      },
      "rangeWatcherTarget"() {
        return this.rangeCols.map(e => e.filterRange[0] + ',' + e.filterRange[1]).join(', ');
      },
      // --------------------------------------------------------------------------------------------------------------

      // The columns to be displayed (filters based on display key then sends to table)
      colsDisplayed() {
        return this.colsGrouped.filter(e => e[this.currentDisplayKey]);
      },
    },
    watch: {
      statType() {
        // If statType changes we need a full data refresh
        this.fetchData();
      },

      // **************************************************************************************************************
      // Target watchers - watch 'summarised' strings in column data stages to trigger data updates
      filterWatcherTarget() { // Filters have changed
        this.performFilteringAndGrouping();
      },
      groupedWatcherTarget() { // Grouping has changed
        this.performFilteringAndGrouping();
      },
      sortWatcherTarget() { // Sorting has changed
        this.performSorting();
      },
      rangeWatcherTarget() { // Ranges have changed
        this.performRangeFiltering();
      },
      // --------------------------------------------------------------------------------------------------------------
    },
    methods: {
      fetchData() {
        const statType = this.statType;
        const app = this;

        // Construct request url
        if (statType != null) {
          const url = config.BASE_URL + '/' + config.STATS_API_PATH + statType.toUpperCase();

          // Set status to loading and send request
          app.tableLoading = true;
          axios.get(
              url,
              {
                auth: {username: config.API_USER, password: config.API_PASSWORD},
                timeout: config.REQUEST_TIMEOUT
              }
          ).catch(error => {throw error;}
          ).then(response => {
            
            if(response.data) {
              // Extract data from response
              const rd = response.data;
              app.reportInfo = rd.reportInfo;
              app.colsRaw = rd.columnList;
              app.dataRaw = rd.dataList;
              app.refreshData();
              
            } else {
              console.log(response);
              throw new TypeError('Oh no! The stats database has returned an error. Please try again later.');
            }

          }).finally(function () {
            app.tableLoading = false;
          });
        }
      },
      
      refreshData() {
        // Clone raw data to base data (raw data effectively provides a backup so no need to re-fetch data)
        this.colsBase = cloneDeep(this.colsRaw);
        this.dataBase = this.dataRaw.slice();
        this.performFilteringAndGrouping();
      },

      performFilteringAndGrouping: function () {
        let dataProcessed = this.dataBase.slice();

        // Iterate through each column with an active filter and apply any filters to the data rows
        for (const fc of this.filterCols) {
          const key = fc.key;
          const allowedValues = fc.selectFilters.map(e => e.value);
          // only include rows where the value of the filtered key is in the array of allowed values
          dataProcessed = dataProcessed.filter(e => allowedValues.includes(e[key])).slice();
        }

        const groupedCols = cloneDeep(this.colsBase);

        // Apply grouping
        if (this.groupedCols.length > 0) {
          // Construct supergroup to construct leaf nodes based on the active group columns
          let sgLeafNodes = sg.supergroup(dataProcessed, this.groupedCols.map(e => e.key)).leafNodes();

          // Apply aggregation functions for any agg columns
          const aggCols = groupedCols.filter(e => e.aggregateType !== null);
          dataProcessed = sgLeafNodes.map(e => this.aggregateRow(e, aggCols));

          // Apply a helpful aggLabel to the group-terms column
          Vue.set(
            groupedCols.find(e => e.key === 'group_term'),
            'aggLabel',
            this.formatGroupTerm(this.groupedCols.map(e => e.label).join("/"))
          );
        }

        // Now we have grouped and filtered the columns we can calculate our range limits
        for (const c of groupedCols) {
          if (c[this.currentRangeableKey]) {
            const data = dataProcessed.map(e => e[c.key]).filter(e => !isNaN(e));
            this.setColumnRangeLimits(c, data);
          }
        }

        this.colsGrouped = cloneDeep(groupedCols); // deep copy as columns can contain nested data
        this.dataProcessed = dataProcessed.slice();

        this.performSorting(); // finally perform sorting to move data to next stage
      },

      performSorting() {
        this.dataSorted = this.dataProcessed.sort((a, b) => this.sortData(a, b, this.sortCols)).slice();
        this.performRangeFiltering(); // Now redo range filtering to progress data to next stage
      },

      performRangeFiltering() {
        this.dataFinal = this.dataSorted.filter(e => this.checkWithinRangeFilters(e, this.rangeCols)).slice();
      },
      
      aggregateRow(row, cols) {
        let result = {};
        result.group_term = this.formatGroupTerm(row.namePath());

        const aggCols = cols.filter(e => e.aggregateType != null);

        // Process non-complex aggregates first, as complex aggregates depend on these values
        for (const col of aggCols.filter(e => e.aggregateType !== 'COMPLEX')) {
          if (col.aggregateType === 'SUM') {
            result[col.key] = row.aggregate(sum, col.key);
          } else if (col.aggregateType === 'COUNT') {
            result[col.key] = row.records.length;
          } else if (col.aggregateType === 'MEAN') {
            result[col.key] = row.aggregate(mean, col.key);
          } else {
            result[col.key] = null;
          }
        }
        // Now process complex aggregates
        for (const col of aggCols.filter(e => e.aggregateType === 'COMPLEX')) {
          if (!col.aggCalculation) {
            throw new TypeError('Complex aggregate type does not have associated calculation');
          } else {
            const numeratorKey = col.aggCalculation.numeratorKey;
            const numerator = result[numeratorKey];
            const denominatorKey = col.aggCalculation.denominatorKey;
            const denominator = result[denominatorKey];
            const multiplier = col.aggCalculation.multiplier;
            result[col.key] = (multiplier * numerator) / denominator;
          }
        }
        return result;
      },

      formatGroupTerm(groupTerm) {
        /* Works on the assumption that column order is also the correct order to "prioritise" group terms. If this
           turns out to not be the case, a new "groupTermOrder" StatColumn attribute will be needed. */
        const termsCount = (groupTerm.match(/\//g) || []).length + 1; // count number of "/" + 1
        if (termsCount > 1) {
          return groupTerm.replace("/", " (") // replace first "/" with open bracket
            .replace(/\//g, ", ") // replace subsequent "/" with comma
            .concat(")");
        } else return groupTerm;
      },

      checkWithinRangeFilters(row, columns) {
        for (const col of columns) {
          // for each ranged column, return false if the row is outside minimum or maximum
          const rowVal = Math.round(row[col.key]);
          const min = Math.round(col.filterRange[0]);
          const max = Math.round(col.filterRange[1]);
          if (rowVal < min || rowVal > max) {
            return false
          }
        }
        // if method has not yet completed, this row has passed all the range filters: return true
        return true;
      },

      setColumnRangeLimits(col, data) {
        const min = data.length > 0 ? Math.min(...data) : null;
        const max = data.length > 0 ? Math.max(...data) : null;
        Vue.set(col, 'filterConfig', {step: 1, range: {'min': min, 'max': max}});
        Vue.set(col, 'filterRange', [min, max]);
      },

      sortData(rowA, rowB, sortCols) {
        let result = 1;
        for (const col of sortCols) {
          result = this.compareByCol(rowA, rowB, col); // returns 1 if rowA should come first (-1 for rowB)
          if (result !== 0) { // if 0 both rows are equal for this column - continue loop
            return result;
          }
        }
        return 1; // if rows are equal across all sort columns just preserve current order
      },

      // Compares 2 rows by a specific column value
      compareByCol(rowA, rowB, col) {
        const dModifier = col.sortType === 'ASC' ? 1 : -1;
        const valA = rowA[col.key];
        const valB = rowB[col.key];

        if ((valA === null && valB === null) || (valA === valB)) {
          return 0; // If both null, or equal, return 0
        } else if (valB === null || valA > valB) {
          return dModifier; // If B is null, or A > B, return modifier
        } else {
          return -dModifier; // Only remaining option is that B is non-null and > than A
        }
      },

      uniqueValues(data, column) {
        const key = column.key;
        let values = uniqBy(data, key);
        const val = values[0];
        if (typeof val === 'string') {
          values = values.sort();
        } else {
          values = values.sort((a, b) => a - b);
        }
        return values.map(e => {
          return {value: e[key]}
        });
      },

      validRange(col) {
        return col.filterConfig.range.min < col.filterConfig.range.max
      },

      // **************************************************************************************************************
      // ********** SORTING METHODS ***********************************************************************************
      // **************************************************************************************************************
      clickHeader(colKey) {
        // Clicking a column header makes it the ONLY sort column, and if already sorted, toggles direction of sort
        const thisCol = this.colsGrouped.find(e => e.key === colKey);

        if (thisCol.sortPriority > 0) {
          Vue.set(thisCol, 'sortType', thisCol.sortType === 'ASC' ? 'DESC' : 'ASC'); // toggle
        } else {
          this.clearAllSorting();
          Vue.set(thisCol, 'sortPriority', 1);
        }
      },
      clickNewPriority(colKey) {
        // Clicking a new priority adds it to the end of the existing priority order
        const thisCol = this.colsGrouped.find(e => e.key === colKey);
        const sortColCount = this.colsGrouped.filter(e => e.sortPriority > 0).length;

        Vue.set(thisCol, 'sortPriority', sortColCount + 1);
      },
      clickExistingPriority(colKey) {
        // Clicking an existing priority swaps it with the next priority, or clears it if already priority 1
        const thisCol = this.colsGrouped.find(e => e.key === colKey);
        const thisColPriority = thisCol.sortPriority;

        if (thisColPriority > 1) {
          // Greater than 1, so swap with the column in front
          const nextCol = this.colsGrouped.find(e => e.sortPriority === (thisColPriority - 1));
          Vue.set(nextCol, 'sortPriority', thisColPriority);
          Vue.set(thisCol, 'sortPriority', thisColPriority - 1);
        } else if (thisColPriority === 1) {
          this.clearPriority(colKey);
        }
      },
      clearPriority(colKey) {
        const thisCol = this.colsGrouped.find(e => e.key === colKey);
        const thisColPriority = thisCol.sortPriority;

        // Remove the priority of the column that was clicked
        Vue.set(thisCol, 'sortPriority', null);

        // Now loop through each col with a lower sort priority and promote
        for (const c of this.colsGrouped.filter(e => e.sortPriority > thisColPriority)) {
          const thisCurrentPos = c.sortPriority;
          Vue.set(c, 'sortPriority', thisCurrentPos > 1 ? thisCurrentPos - 1 : null);
        }
      },
      clearAllSorting() {
        for (const col of this.colsGrouped) {
          Vue.set(col, 'sortPriority', null);
        }
      },
      // --------------------------------------------------------------------------------------------------------------
      // --------------------------------------------------------------------------------------------------------------
      // --------------------------------------------------------------------------------------------------------------
    },
  };
</script>

<style lang="scss">
  @import '../custom';

  $select-font-size: 0.9em;

  .stats-page {
    .form-group {
      margin-bottom: 0 !important;
    }
    
    .stats-page__per-page-select {
      padding-top: 0;
      padding-bottom: 0;
      font-size: 0.8em;
    }
    
    .stats-page__per-page-select:disabled {
      color: $secondary;
      background-color: $faded-gray;
    }

    .stats-page__filter-label {
      font-size: $select-font-size;
    }

    .slide-fade-enter-active {
      transition: all .5s ease;
    }

    .slide-fade-leave-active {
      transition: all .3s ease;
    }

    .slide-fade-enter, .slide-fade-leave-to {
      transform: translateY(-20px);
      opacity: 0;
    }

    .noUi-handle {
      background-color: $primary-very-light;
      border-color: $primary-light;
      background-clip: content-box;
      transform: none;
      box-shadow: none;
    }

    .noUi-handle::after,.noUi-handle::before {
      background-color: $primary;
    }
  }

  .multiselect {

    .multiselect,
    .multiselect__input,
    .multiselect__single {
      font-family: inherit;
      font-size: $select-font-size;
      touch-action: manipulation;
    }

    .multiselect__tag {
      position: relative;
      display: inline-block;
      padding: 4px 26px 4px 10px;
      border-radius: 5px;
      margin-right: 10px;
      color: $light;
      line-height: 1;
      background: $primary;
      border-color: $primary-dark;
      margin-bottom: 5px;
      white-space: nowrap;
      overflow: hidden;
      max-width: 100%;
      text-overflow: ellipsis;
    }

    .multiselect__tags {
      padding-bottom: 0;
    }

    .multiselect__tag-icon {
      cursor: pointer;
      margin-left: 7px;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      font-weight: 700;
      font-style: initial;
      width: 22px;
      text-align: center;
      line-height: 22px;
      transition: all 0.2s ease;
      border-radius: 5px;
    }

    .multiselect__tag-icon:after {
      content: "×";
      color: $secondary-light;
      font-size: 14px;
    }

    .multiselect__tag-icon:focus,
    .multiselect__tag-icon:hover {
      background: $primary-dark;
    }

    .multiselect__tag-icon:focus:after,
    .multiselect__tag-icon:hover:after {
      color: $light;
    }

    .multiselect__option--highlight {
      background: $primary;
      outline: none;
      color: $light;
    }
  }
</style>
