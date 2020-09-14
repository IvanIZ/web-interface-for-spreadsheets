import React, { Component, useState } from 'react';
import ReactDOM from "react-dom"
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import logo from '../logo.svg';
import '../App.css';
import {ExcelRenderer, OutTable} from 'react-excel-renderer';
import {
  Container,
  Row,
  Col,
  Jumbotron,
  Button,
  Table, Modal, ModalHeader, ModalFooter, ModalBody, Form, FormGroup, Label, Input
} from 'reactstrap';
import {
  BrowserRouter as Router,
  Route,
  Link,
  useHistory,
  Redirect
} from "react-router-dom";
import Spreadsheet from "react-spreadsheet";
import { ReactCanvasGrid } from 'react-canvas-grid';
import InfiniteScroll from "react-infinite-scroll-component";
import io from "socket.io-client";

//default order: 6
const BPlusTree = require('bplustree');
let tree = new BPlusTree()

let outputTable, searchResultTable, single_search_button, range_search_button, single_remove_button, range_remove_button;
let single_search_returned_key = [], remove_returned_key = [], range_remove_returned_key = []
let singleSearchResult = [], range_search_result = [], range_search_returned_key = [], arri_array = []

let data = [], dataMatrix = [], columns = [], buffer = [], single_search_display_matrix = [], buffer_copy = []
let DIV_WIDTH = 1260
let PREFETCH_SIZE = 50
let noData = true
let ATT_NUM = 7
let scrolltop = 0
let data_display = []

//search result variables
let SEARCH_RESULT_PREFETCH_SIZE = 10;
let search_result_size = 0;
let current_result_fetch_index = 10;
let resultBuffer = []

let current_fetch_index = 51 //initial pre-prefetch index
let num_attr = 0;
const style = {
  height: 2500,
  width: DIV_WIDTH,
  border: "0.2px solid gray",
  margin: 0,
  padding: 0
};

const search_display_style = {
  height: 500,
  width: DIV_WIDTH,
  border: "0.2px solid gray",
  margin: 0,
  padding: 0
};

class Start extends Component {

  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      cols: [],
      attri: [],
      isSearchSelectionModalOpen: false, 
      isRangeSearchModalOpen: false, 
      isSingelSearchModalOpen: false,

      isUploadAckModalOpen: false,
      isErrorModalOpen: false,

      single_search_index: '', 
      single_search_attribute: '',
      range_search_attribute:'',

      isSingleSearch: false,

      isResultPanelModalOpen: false, 
      searchResult: [], 

      range_search_lower_index: '', 
      range_search_upper_index: '', 

      single_remove_index: '', 
      range_remove_lower_index: '', 
      range_remove_upper_index:'', 
      isSingleRemoveModalOpen: false, 
      isRangeRemoveModalOpen: false, 

      isRemoveAckModalOpen: false,
      items: Array.from({ length: 0 }),
      hasMore: false,
      load_from_buffer_to_matrix: false, 

      //retrieval display variables
      hasMoreResult: false,
      resultItems: Array.from({ length: 0 }), 
      load_result_from_buffer_to_matrix: false, 

      redirect_import_page: false, 
      import_page_link: '/result', 

      data_original: [], 
      check_cell_update: false, 

      test_block: "ORIGINAL MESSAGE"
    }

    this.socket = io('localhost:3001');

    this.socket.on('RECEIVE_MESSAGE', function(data){
      addMessage(data);
    });

    const addMessage = data => {
        console.log(data);
        let change_table = data.data
        // y, value, x
        for (var x = 0; x < change_table.length && x < data_display.length; x++) {
          let j = change_table[x][0] - 1   // 0 --> y_coord
          let value = change_table[x][1] // 1 --> actual value
          let i = change_table[x][2] - 1 // 2 --> x_coord
          data_display[i][j] = value
        }
        this.setState({
          test_block: data.try_message
        });
    };

    this.toggleSearchSelectionModal = this.toggleSearchSelectionModal.bind()
    this.toggleRangeSearchModal = this.toggleRangeSearchModal.bind()
    this.toggleSingleSearchModal = this.toggleSingleSearchModal.bind()
    this.toggleUploadAckModal = this.toggleUploadAckModal.bind()
    this.toggleResultPanelModal = this.toggleResultPanelModal.bind()
    this.toggleErrorModal = this.toggleErrorModal.bind()
    this.toggleSingleRemoveModal = this.toggleSingleRemoveModal.bind()
    this.toggleRangeRemoveModal = this.toggleRangeRemoveModal.bind()
    this.toggleRemoveAckModal = this.toggleRemoveAckModal.bind()
  }

  // fetch 50 rows of data into the buffer
  async componentDidMount() {
    document.addEventListener("keydown", this.handleEnter, false);

    buffer = []
    buffer_copy = []
    let url = '/database/fetch-fifty-rows/' + 1
      fetch(url)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by fetchMoreRows function")
          noData = true
        } else {
          noData = false;
          //load returned data into the buffer
          for (var i = 0; i < data.length; i++) {
            var temp = []
            for (var j = 1; j <= ATT_NUM; j++) {
              temp[j - 1] = data[i]['attribute' + j]
            }
            buffer[i] = temp;
            buffer_copy[i] = temp.slice();
          }
          console.log("the buffer is: ")
          console.log(buffer)
        }
      });
  }

  toggleRemoveAckModal = () => {
    this.setState({
      isRemoveAckModalOpen: !this.state.isRemoveAckModalOpen
    })
  }

  toggleSingleRemoveModal = () => {
    this.setState({
      isSingleRemoveModalOpen: !this.state.isSingleRemoveModalOpen
    })
  }

  toggleRangeRemoveModal = () => {
    this.setState({
      isRangeRemoveModalOpen: !this.state.isRangeRemoveModalOpen
    })
  }

  toggleErrorModal = () => {
    this.setState({
      isErrorModalOpen: !this.state.isErrorModalOpen
    })
  }


  toggleUploadAckModal = () => {
    this.setState({
      isUploadAckModalOpen: !this.state.isUploadAckModalOpen
    })
  }

  toggleSearchSelectionModal = () => {
    this.setState({
      isSearchSelectionModalOpen: !this.state.isSearchSelectionModalOpen
    })
  }

  toggleRangeSearchModal = () => {
    this.setState({
      isRangeSearchModalOpen: !this.state.isRangeSearchModalOpen,
      isSearchSelectionModalOpen: !this.state.isSearchSelectionModalOpen
    })
  }

  toggleSingleSearchModal = () => {
    this.setState({
      isSingelSearchModalOpen: !this.state.isSingelSearchModalOpen
    })
  }

  getFinalSingleSearchResult = (resultMatrix) => {
    
    console.log("final single search result is ", resultMatrix)
    if (resultMatrix.length == 0) {
      searchResultTable = <Jumbotron>
                              <div>
                                  No Entries Are Retrieved
                              </div>
                          </Jumbotron>
    } else {
      searchResultTable = <Jumbotron>
                            <div>
                                Below Is The Retrieved Data
                            </div>
                             <div>
                                <Spreadsheet data={resultMatrix} />
                             </div>
                        </Jumbotron>
    }
    this.toggleResultPanelModal()
  }

  toggleResultPanelModal = () => {
    this.setState({
      isResultPanelModalOpen: !this.state.isResultPanelModalOpen
    })
  }

  handleSearchIndexChange = (e) => {
    this.setState({
        [e.target.name]: e.target.value
    })
  }

  onSingleSearchKeySubmit = async (e) => {
    e.preventDefault();
    if (this.state.single_search_index == '') {
      this.toggleErrorModal()
    } else {
      this.toggleSingleSearchModal()  //close up the search modal

      //fetch the result from the db
      let onID = false
      if (this.state.single_search_attribute === '') {
        onID = true
      }
      let formResults = {
        attribute: this.state.single_search_attribute,
        index: this.state.single_search_index,
        onID: onID
      }
      //POST req here
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({formResults})
      };
      fetch('/database/single-index-retrieval', requestOptions)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by single retrieval function")
          let resultMatrix = []
          this.getFinalSingleSearchResult(resultMatrix)
        } else {

          //fill in result matrix
          let resultMatrix = []
          searchResultTable = ''
          for (var i = 0; i < data.length; i++) {
            let temp = []
            for (var j = 1; j < num_attr; j++) {
              temp[j - 1] = { value: data[i]["attribute" + j]}
            }
            resultMatrix[i] = temp
          }
          this.getFinalSingleSearchResult(resultMatrix)
        }
      });
    }
  }

  onRangeSearchIndexSubmit = (e) => {
    e.preventDefault();
    if (this.state.range_search_lower_index == '' && this.state.range_search_upper_index == '') {
      this.toggleErrorModal()
    } else {
      this.toggleRangeSearchModal() // close range search modal
      let lowerBound, upperBound
      //Restore default min/max bound if null entered
      if (this.state.range_search_lower_index == '') {
        lowerBound = Number.MIN_VALUE
      } else {
        lowerBound = Number(this.state.range_search_lower_index)
      }

      if (this.state.range_search_upper_index == '') {
        upperBound = Number.MAX_VALUE
      } else {
        upperBound = Number(this.state.range_search_upper_index)
      }

      let onID = false;
      if (this.state.range_search_attribute === '') {
        onID = true;
      }

      //fetch the result from the db
      let formResults = {
        attribute: this.state.range_search_attribute,
        lower_index: lowerBound,
        upper_index: upperBound, 
        onID: onID
      }
      //POST req here
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({formResults})
      };
      fetch('/database/range-index-retrieval', requestOptions)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by range retrieval function")
          let resultMatrix = []
          this.getFinalSingleSearchResult(resultMatrix)
        } else {

          //fill in result matrix
          let resultMatrix = []
          searchResultTable = ''
          for (var i = 0; i < data.length; i++) {
            let temp = []
            for (var j = 1; j < num_attr; j++) {
              temp[j - 1] = { value: data[i]["attribute" + j]}
            }
            resultMatrix[i] = temp
          }
          this.getFinalSingleSearchResult(resultMatrix)
        }
      
      });
    }
  }

  fetchMoreData = () => {
    if (this.state.items.length >= Math.ceil(this.state.rows.length / 50.0) ) {
      this.setState({ hasMore: false });
      console.log('the final number of page is: ' + Math.ceil(this.state.rows.length / 50.0))
      return;
    }

    //load data from buffer to the display data matrix
    if (this.state.load_from_buffer_to_matrix == false) {
      this.setState({
        load_from_buffer_to_matrix: true
      })

      //double check if buffer has been loaded
      if (buffer.length == 0) {
        this.fetchMoreRows(PREFETCH_SIZE);
      }
    } else {

      //move data from buffer to matrix
      for (var i = 0; i < PREFETCH_SIZE; i++) {
        if (i < buffer.length) {
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: buffer[i].id}
              jsonObj['id'] = item
            } else {
              let item = {text: buffer[i]["attribute" + j]}
              jsonObj['attr' + j] = item
            }
          }
          dataMatrix[i] = jsonObj
        } else {
          console.log("i is greater than " + PREFETCH_SIZE + " now")
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: ''}
              jsonObj['id'] = item
            } else {
              let item = {text: ''}
              jsonObj['attr' + j] = item
            }
          }
          dataMatrix[i] = jsonObj
        }
      }

      //pre-fetch new data into the buffer
      this.fetchMoreRows(current_fetch_index)
      current_fetch_index = current_fetch_index + PREFETCH_SIZE

      console.log("data matrix at fetch more data is: ")
      console.log(dataMatrix)
    }

    // a fake async api call like which sends
    // 20 more records in 1.5 secs
    setTimeout(() => {
      this.setState({
        items: this.state.items.concat(Array.from({ length: 1 }))
      });
    }, 1500);
  };

  fetchMoreResult = () => {
    if (this.state.resultItems.length >= Math.ceil(search_result_size / 10.0)) {
      this.setState({ hasMoreResult: false });
      return;
    }

    if (this.state.load_result_from_buffer_to_matrix == false) {
      this.setState({
        load_result_from_buffer_to_matrix: true
      })
    } else {
      //...update the result display matrix and result buffer...

      //move data from search result buffer to result display matrix
      for (var i = 0; i < SEARCH_RESULT_PREFETCH_SIZE; i++) {
        if (i < resultBuffer.length) {
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: resultBuffer[i].id}
              jsonObj['id'] = item
            } else {
              let item = {text: resultBuffer[i]["attribute" + j]}
              jsonObj['attr' + j] = item
            }
          }
          single_search_display_matrix[i] = jsonObj
        } else {
          let jsonObj = {}
          for (var j = 0; j <= num_attr; j++) {
            if (j == 0) {
              let item = {text: ''}
              jsonObj['id'] = item
            } else {
              let item = {text: ''}
              jsonObj['attr' + j] = item
            }
          }
          single_search_display_matrix[i] = jsonObj
        }
      }

      //update search result buffer
      this.loadResultBuffer(current_result_fetch_index)
      current_result_fetch_index = current_result_fetch_index + SEARCH_RESULT_PREFETCH_SIZE

      console.log("the new search result display matrix is: ")
      console.log(single_search_display_matrix)
    }

    // a fake async api call like which sends
    // 20 more records in .5 secs
    setTimeout(() => {
      this.setState({
        resultItems: this.state.resultItems.concat(Array.from({ length: 1 }))
      });
    }, 500);
  };

  loadResultBuffer = (index) => {
    console.log("CALLED LOADRESULTBUFFER!")
    resultBuffer = []
    let url = '/database/fetch-ten-rows/' + index
      fetch(url)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by fetchMoreResult function")
        } else {
          //load returned data into the buffer
          for (var i = 0; i < data.length; i++) {
            resultBuffer[i] = data[i]
          }
          console.log("the result buffer is: ")
          console.log(resultBuffer)
        }
      });
  }

  fetchMoreRows = (index) => {
    buffer = []
    buffer_copy = []
    let url = '/database/fetch-fifty-rows/' + index
      fetch(url)
      .then(res => res.json())      
      .then(data => {
        if (data.length === 0) {
          console.log("No data is fetched by fetchMoreRows function")
          noData = true
        } else {
          noData = false;
          //load returned data into the buffer
          for (var i = 0; i < data.length; i++) {
            var temp = []
            for (var j = 1; j <= ATT_NUM; j++) {
              temp[j - 1] = data[i]['attribute' + j]
            }
            buffer[i] = temp;
            buffer_copy[i] = temp.slice()
          }
          console.log("the buffer is: ")
          console.log(buffer)
        }
      });
  }

  // PROTOTYPE FOR HOW TO DYNAMICALLY PRE-FETCH DATA !!!!!!!!!!!!!!!!!!
  display = () => {
    this.setState({
      data_original: this.state.data_original.concat(buffer)
    })
    data_display = data_display.concat(buffer_copy) 
    this.fetchMoreRows(current_fetch_index)
    current_fetch_index += 50
    console.log("diaplay called")
  }

  redirect_import = () => {
    this.setState( {
      redirect_import_page: true
    })
  }

  handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) {
      this.display()
    }

    if (e.target.scrollTop % 1000 < 300) {
      scrolltop = e.target.scrollTop   
    }
    console.log("scrollTop is: ", e.target.scrollTop)
  }

  show_state = () => {
    if (this.state.data_original.length !== 0) {
      console.log("the current state of data_original is: ", this.state.data_original)
      console.log("the current state of data_display is: ", data_display)
    }
  }

  sendMessage = (message) => {
    this.socket.emit('SEND_MESSAGE', message);
  }

  check_cell_change = (e) => {
    if (e.keyCode === 13) {
      console.log("Enter key down")
      console.log(scrolltop)

      // user pressed enter in a cell. Check update
      let start_row_index = parseInt((scrolltop / 25) - 10)
      if (start_row_index < 0) {
        start_row_index = 0
      }
      let end_row_index = start_row_index + 90
      let change_detected = false

      // create a message to socket
      let message = {
        data:[], // 2d array to store difference: y, value, x
        try_message: "SENT MESSAGE! SUCCESS!"
      }
      let index = 0;
      for (var x = start_row_index; x < end_row_index && x < this.state.data_original.length; x++) {
        for (var y = 0; y < ATT_NUM; y++) {
          let temp = []
          console.log("at (", x, ",", y, ") :", data_display[x][y])
          console.log("at (", x, ",", y, ") :", this.state.data_original[x][y])
          if (data_display[x][y] !== this.state.data_original[x][y]) {
            change_detected = true
            temp[0] = y + 1; // 0 --> y_coord; + 1 for database backend indexing
            temp[1] = data_display[x][y]; // 1--> actual value
            temp[2] = x + 1; // 2 --> x_coord; + 1 for database backend indexing
            message.data[index] = temp;
            this.state.data_original[x][y] = data_display[x][y]
            index++;
          }
        }
      }
      this.sendMessage(message)

      // Update backend
      if (change_detected) {
        //POST req here
        const requestOptions = {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message})
        };
        fetch('/database/update-content', requestOptions)
      }
    }
  }

  render() {
    if (this.state.redirect_import_page) {
      return <Redirect to={this.state.import_page_link} />
    }
    return (
      <div className="App">
        <script src="node_modules/handsontable/dist/handsontable.full.min.js"></script>
        <link href="node_modules/handsontable/dist/handsontable.full.min.css" rel="stylesheet" media="screen"></link>
         <Jumbotron className='logo-jumbo'>
          </Jumbotron >
          <div>
          <Jumbotron >
            {/* <Container fluid> */}
                  <h1 className="display-3"> Welcome to spreadsheet web!</h1>
                  <p className="lead">This is a simple web interface that allows you to upload spreadsheets and retrieve data.</p>
                  <hr className="my-2" />
                  <p>Choose display data, or retrieve data from below</p>
                  <p>{this.state.test_block}</p>
                  <p className="lead">
                    <Button size='lg' className='redirect-button' color="primary" onClick={this.redirect_import} >To Import Page</Button> 
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Button size='lg' className='display-button' color="primary" onClick={this.display} >Display Dataset</Button> 
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Button size='lg' className='display-button' color="primary" onClick={this.show_state} >show state</Button> 
                  </p>
                  {range_search_button}
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  {single_search_button}
              
            {/* </Container> */}
        </Jumbotron>
        </div>
        {searchResultTable}

        <hr />
        Below Is The Entire Data Set  
        <div id = "display_portion"  onKeyUp={this.check_cell_change} onScroll={this.handleScroll}  tabIndex="1">
          <HotTable data={data_display} 
            colHeaders={true} 
            rowHeaders={true} 
            width="100%" 
            height="300"
            colWidths="100%"
            rowHeights="25"
            contextMenu={true}
             />
        </div>
          
      </div>

    );
  }
}
export default Start;
