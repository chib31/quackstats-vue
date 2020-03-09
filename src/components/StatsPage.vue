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
                <b-checkbox switch v-for="col of groupableCols" :key="col.key" v-model="col.grouped">
                  {{col.label}}
                </b-checkbox>
              </b-dropdown-form>
            </b-dropdown>
            <b-dropdown text="Choose Columns" variant="light" class="mx-1 mt-auto" menu-class="text-nowrap"
                        v-if="resultsFound">
              <b-dropdown-form>
                <b-checkbox switch v-for="col of optionalViewCols"
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
    <hr class="p-0 m-0 pb-2"/>
    <transition name="slide-fade">
      <div v-if="showFilters" class="mb-3 mx-2 mt-3">
        <b-container fluid="true" class="px-4">
          <b-row cols="1" cols-md="2" cols-xl="3">
            <b-col v-for="col of filterableCols" :key="col.key" class="px-1 mb-1">
              <b-form-group :label="col.label" label-cols="3"
                            label-class="pt-2 pr-2 text-right stats-page__filter-label">
                <multiselect v-model="col.selectFilters"
                             class="multiselect"
                             :taggable="true"
                             :options="uniqueValues(dataRaw, col)"
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
          <hr class="my-4" v-if="rangeableCols.length > 0"/>
          <b-row cols="1" cols-md="2" cols-xl="3">
            <b-col v-for="col of rangeableCols" :key="col.key" class="px-1">
              <b-form-group :label="col[currentLabelKey]" label-cols="3"
                            label-class="pr-2 text-right stats-page__filter-label">
                <b-form v-if="resultsFound">
                  <b-row class="text-center">
                    <b-col>
                      <b-form-input type="number" size="sm" v-model.number="col.filterRange[0]" placeholder="Any"/>
                    </b-col>
                    <b-col cols="auto" class="p-0 m-0">
                      <b-form-text>to</b-form-text>
                    </b-col>
                    <b-col>
                      <b-form-input type="number" size="sm" v-model.number="col.filterRange[1]" placeholder="Any"/>
                    </b-col>
                  </b-row>
                </b-form>
              </b-form-group>
            </b-col>
          </b-row>
          <hr class="my-4"/>
        </b-container>
      </div>
    </transition>
    <stats-table
      v-if="resultsFound && !tableLoading"
      :table-data="dataDisplayed"
      :table-columns="colsDisplayed"
      :table-loading="tableLoading"
      :grouping-active="groupingActive"
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
  import {uniqBy, cloneDeep} from "lodash";
  import Multiselect from 'vue-multiselect'
  import * as sg from 'supergroup';

  export default {
    components: {
      StatsTable,
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
        colsActive: [],
        dataRaw: [],
        dataActive: [],
      };
    },
    mixins: [Utils],
    mounted() {
      this.fetchData();
    },
    computed: {
      groupingActive() {
        return this.colsActive.filter(e => e.grouped).length > 0;
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
        return this.dataActive && this.dataActive.length > 0;
      },

      // **************************************************************************************************************
      // AVAILABLE COLUMN SETS
      filterableCols() {
        return this.colsActive.filter(e => e.filterable);
      },
      groupableCols() {
        return this.colsActive.filter(e => e.groupable);
      },
      rangeableCols() {
        return this.colsActive.filter(e => e[this.currentRangeableKey]);
      },
      optionalViewCols() {
        return this.colsActive.filter(e => e[this.currentViewabilityKey] === 'OPTIONAL')
      },

      // **************************************************************************************************************
      // ACTIVE COLUMN SETS
      filterCols() {
        return this.getFilterCols(this.colsActive); //the columns with filters directly applied
      },
      groupedCols() {
        return this.getGroupCols(this.colsActive); //the columns with grouping flags directly applied
      },
      sortCols() {
        return this.getSortCols(this.colsActive); //the columns with sort priorities directly applied
      },
      rangeCols() {
        return this.getRangeCols(this.colsActive) //the columns with range filters directly applied
      },

      // **************************************************************************************************************
      // WATCHER TARGETS - only exist as lightweight 'summaries' for watchers, to avoid need for deep watching
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

      // **************************************************************************************************************
      // The columns to be displayed (filters based on display key then sends to table)
      dataDisplayed() {
        return this.dataActive.filter(e => e.include);
      },
      // The columns to be displayed (filters based on display key then sends to table)
      colsDisplayed() {
        return this.colsActive.filter(e => e[this.currentDisplayKey]);
      },
    },
    watch: {
      statType() {
        // If statType changes we need a full data refresh
        this.fetchData();
      },

      // **************************************************************************************************************
      // Target watchers - watch 'summarised' strings in column data stages to trigger data updates
      filterWatcherTarget() { //filters have changed
        if (this.groupingActive) { //grouping is active so we need to refresh the data
          let colsActive = this.colsActive;
          let dataActive = this.dataRaw.slice();

          dataActive = this.groupData(dataActive, colsActive);
          dataActive = this.rangeData(dataActive, colsActive);
          dataActive = this.sortData(dataActive, colsActive);
          this.dataActive = dataActive;

          colsActive = this.renameGroupTermsColumn(colsActive);
          this.colsActive = colsActive;
          
        } else { //no grouping so we can simply apply the filtering to the current data
          this.dataActive = this.filterData(this.dataActive, this.colsActive);
        }
      },
      
      groupedWatcherTarget() { //grouping has changed
        let colsActive = this.colsActive;
        let dataActive = this.dataRaw.slice();

        dataActive = this.groupData(dataActive, colsActive);
        dataActive = this.rangeData(dataActive, colsActive);
        dataActive = this.sortData(dataActive, colsActive);
        this.dataActive = dataActive;

        colsActive = this.renameGroupTermsColumn(colsActive);
        this.colsActive = colsActive;
      },
      
      sortWatcherTarget() { // Sorting has changed
        this.dataActive = this.sortData(this.dataActive, this.colsActive);
      },
      
      rangeWatcherTarget() { // Ranges have changed
        this.dataActive = this.rangeData(this.dataActive, this.colsActive);
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
              
              // Set include to true by default on all rows
              this.dataRaw = this.includeAll(rd.dataList);
              
              // Push raw data through all processing stages
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

      // **************************************************************************************************************
      // ********** DATA PROCESSING METHODS ***************************************************************************
      // **************************************************************************************************************
      refreshData() {
        let colsActive = cloneDeep(this.colsRaw);
        let dataActive = this.dataRaw.slice();
        
        dataActive = this.groupData(dataActive, colsActive);
        dataActive = this.filterData(dataActive, colsActive);
        dataActive = this.rangeData(dataActive, colsActive);
        dataActive = this.sortData(dataActive, colsActive);
        
        if (this.groupingActive) {
          colsActive = this.renameGroupTermsColumn(colsActive);
        }
        
        this.colsActive = colsActive;
        this.dataActive = dataActive;
      },
      
      filterData(data, cols) {
        // "soft" filters data using include flag
        const filterCols = this.getFilterCols(cols);
        for (let row of data) {
          const include = this.rowPassesFilters(row, filterCols);
          Vue.set(row, 'include', include);
        }
        return data;
      },
      
      groupData(data, cols) {
        let groupedCols = this.getGroupCols(cols);
        
        if (groupedCols.length > 0) {
          // Always filter data before grouping
          let softFilteredData = this.filterData(data, cols);
          let hardFilteredData = softFilteredData.filter(e => e.include);
          
          // Construct supergroup to construct leaf nodes based on the active group columns
          let sgLeafNodes = sg.supergroup(hardFilteredData, groupedCols.map(e => e.key)).leafNodes();

          // Apply aggregation functions for any agg columns, and add include flag to every row
          const aggCols = cols.filter(e => e.aggregateType !== null);
          return this.includeAll(sgLeafNodes.map(e => this.aggregateRow(e, aggCols)));
          
        } else {
          // No grouping required - just return input (filtering will be done separately)
          return data;
        }
      },
      
      rangeData(data, cols) {
        const rangeCols = this.getRangeCols(cols);
        return data.map(e => this.checkWithinRangeFilters(e, rangeCols)).slice();
      },

      sortData(data, cols) {
        const sortCols = this.getSortCols(cols).sort((a, b) => a.sortPriority - b.sortPriority);
        return data.sort((a, b) => this.compareRows(a, b, sortCols)).slice();
      },

      // **************************************************************************************************************
      // ********** COLUMN PROCESSING METHODS *************************************************************************
      // **************************************************************************************************************
      renameGroupTermsColumn(cols) {
        // Apply a helpful aggLabel to the group-terms column
        const groupedCols = cols.filter(e => e.grouped);
        Vue.set(
            cols.find(e => e.key === 'group_term'),
            'aggLabel',
            this.formatGroupTerm(groupedCols.map(e => e.label).join("/"))
        );
        return cols;
      },

      // **************************************************************************************************************
      // ********** SORTING METHODS ***********************************************************************************
      // **************************************************************************************************************
      clickHeader(colKey) {
        // Clicking a column header makes it the ONLY sort column, and if already sorted, toggles direction of sort
        const thisCol = this.colsActive.find(e => e.key === colKey);

        if (thisCol.sortPriority > 0) {
          Vue.set(thisCol, 'sortType', thisCol.sortType === 'ASC' ? 'DESC' : 'ASC'); // toggle
        } else {
          this.clearAllSorting();
          Vue.set(thisCol, 'sortPriority', 1);
        }
      },
      clickNewPriority(colKey) {
        // Clicking a new priority adds it to the end of the existing priority order
        const thisCol = this.colsActive.find(e => e.key === colKey);
        const sortColCount = this.colsActive.filter(e => e.sortPriority > 0).length;

        Vue.set(thisCol, 'sortPriority', sortColCount + 1);
      },
      clickExistingPriority(colKey) {
        // Clicking an existing priority swaps it with the next priority, or clears it if already priority 1
        const thisCol = this.colsActive.find(e => e.key === colKey);
        const thisColPriority = thisCol.sortPriority;

        if (thisColPriority > 1) {
          // Greater than 1, so swap with the column in front
          const nextCol = this.colsActive.find(e => e.sortPriority === (thisColPriority - 1));
          Vue.set(nextCol, 'sortPriority', thisColPriority);
          Vue.set(thisCol, 'sortPriority', thisColPriority - 1);
        } else if (thisColPriority === 1) {
          this.clearPriority(colKey);
        }
      },
      clearPriority(colKey) {
        const thisCol = this.colsActive.find(e => e.key === colKey);
        const thisColPriority = thisCol.sortPriority;

        // Remove the priority of the column that was clicked
        Vue.set(thisCol, 'sortPriority', null);

        // Now loop through each col with a lower sort priority and promote
        for (const c of this.colsActive.filter(e => e.sortPriority > thisColPriority)) {
          const thisCurrentPos = c.sortPriority;
          Vue.set(c, 'sortPriority', thisCurrentPos > 1 ? thisCurrentPos - 1 : null);
        }
      },
      clearAllSorting() {
        for (const col of this.colsActive) {
          Vue.set(col, 'sortPriority', null);
        }
      },

      // **************************************************************************************************************
      // ********** COL GROUP METHODS *********************************************************************************
      // **************************************************************************************************************
      getFilterCols(cols) {
        return cols.filter(e => e.selectFilters && e.selectFilters.length > 0);
      },
      
      getGroupCols(cols) {
        return cols.filter(e => e.grouped);
      },

      getSortCols(cols) {
        return cols.filter(e => e.sortPriority > 0).sort((a, b) => a.sortPriority - b.sortPriority);
      },

      getRangeCols(cols) {
        return cols.filter(e => e[this.currentRangeableKey] && e.filterRange && (e.filterRange[0] || e.filterRange[1]));
      },
      
      // **************************************************************************************************************
      // ********** UTIL METHODS **************************************************************************************
      // **************************************************************************************************************
      includeAll(data) {
        for (let row of data) {
          Vue.set(row, 'include', true);
        }
        return data;
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
        const complexAggCols = aggCols.filter(e => e.aggregateType === 'COMPLEX');
        for (const complexCol of complexAggCols) {
          if (!complexCol.aggCalculation) {
            throw new TypeError('Complex aggregate type does not have associated calculation');
          } else {
            const numeratorKey = complexCol.aggCalculation.numeratorKey;
            const numerator = numeratorKey ? result[numeratorKey] : result[complexCol.key];
            const denominatorKey = complexCol.aggCalculation.denominatorKey;
            const denominator = denominatorKey ? result[denominatorKey] : result[complexCol.key];
            const multiplier = complexCol.aggCalculation.multiplier;
            result[complexCol.key] = (multiplier * numerator) / denominator;
          }
        }
        return result;
      },

      rowPassesFilters(row, cols) {
        for (const col of cols) {
          const allowedValues = col.selectFilters.map(e => e.value);
          if (!allowedValues.includes(row[col.key])) {
            return false;
          }
        }
        // Has got this far - therefore passed all filter conditions
        return true;
      },

      // Note this is used for both the header AND data values
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

      // Sets "include" to true if row is within all column ranges, else false
      checkWithinRangeFilters(row, columns) {
        for (const col of columns) {
          // for each ranged column, return false if the row is outside minimum or maximum
          const rowVal = Math.round(row[col.key]);
          const min = col.filterRange[0];
          const max = col.filterRange[1];
          // Only filter on min / max if non-null
          const minIsSet = min === 0 || min > 0;
          const maxIsSet = max === 0 || max > 0;
          if ((minIsSet && rowVal < min) || (maxIsSet && rowVal > max)) {
            Vue.set(row, 'include', false);
            return row;
          }
        }
        // if method has not yet completed, this row has passed all the range filters: return true
        Vue.set(row, 'include', true);
        return row;
      },

      // Determines which of 2 rows should come first based on current sorting rules
      compareRows(rowA, rowB, sortCols) {
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
        if (values && values.length > 0) {
          const val = values[0];
          if (typeof val === 'string') {
            values = values.sort();
          } else {
            values = values.sort((a, b) => a - b);
          }
          return values.map(e => {
            return {value: e[key]}
          });
        }
        else return null;
      },
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
    
    .stats-page__range-input {
      max-width: 80px;
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
