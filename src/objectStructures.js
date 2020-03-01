function responseData() {
  return {
    "responseData": {
      "reportInfo" : "string",
      "columnList" : "string",
      "dataList" : "string"
    }
  }
}

function column() {
  return {
    "column": {
      "key": "player_name",
      "label": "Player",
      "rawValue": true,
      "viewability": "ALWAYS_SHOW",
      "display": true,
      "filterable": true,
      "rangeable": false,
      "sortType": "ASC",
      "formatter": "string",
      "groupable": true,
      "grouped": false,
      "aggLabel": "string",
      "aggregateType": "string",
      "aggCalculation": {
        "numeratorKey" : "string",
        "denominatorKey" : "string",
        "multiplier" : 1,
      },
      "aggViewability": "ALWAYS_HIDE",
      "aggDisplay": false,
      "aggRangeable": false,
      "displayOrder": 20,
      "aggDisplayOrder": 20,
      "sortPriority": 1,
      "selectFilters": [
        {
          "value": "string"
        }
      ],
      "filterConfig": {
        "step": 1,
        "range": {
          "min": 1,
          "max": 2
        }
      },
      "filterRange": [
        1,
        2
      ]
    }
  }
}

function row() {
  return {
    "row": {
      "id": 74,
      "player_name": "J Anderson",
      "runs": 6,
      "deliveries": 4,
      "strike_rate_bat": 150.0,
      "innings": 1,
      "fours": 0,
      "sixes": 1,
      "wicket_type": "Caught",
      "position": 6,
      "percent_total": 3.7267080745341614,
      "wickets_batting": 1,
      "not_outs": 0,
      "fixture": "Flying Ducksmen (1st-May-19, 35 overs)",
      "season": "2019",
      "opposition": "Flying Ducksmen",
      "date": "2019-05-05",
      "result": "Won",
      "team_total": 161,
      "match_format": "Limited Overs",
      "over_length": 6
    }
  }
}

function supergroup() {
  return {
    "sg": {
      "supergroup": function() {},
    }
  }
}
