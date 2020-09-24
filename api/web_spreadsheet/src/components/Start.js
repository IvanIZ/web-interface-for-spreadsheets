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
  Table, Modal, ModalHeader, ModalFooter, ModalBody, Form, FormGroup, Label, Input, ListGroup
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

let outputTable, searchResultTable, single_search_button, range_search_button

let data = [], dataMatrix = [], columns = [], buffer = [], buffer_copy = []
let DIV_WIDTH = 1260
let PREFETCH_SIZE = 50
let noData = true
let ATT_NUM = 7
let scrolltop = 0
let data_display = []

let current_fetch_index = 51 //initial pre-prefetch index
let num_attr = 0;

class Start extends Component {

  constructor() {
    super();
    this.state = {
      rows: [],
      cols: [],
      attri: [],
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

      test_block: "ORIGINAL MESSAGE", 
      users:[], 
      user_text_block: "", 

      isUserNamePromptOpen: true, 
      user_name: "", 

      edit_message: "Last Edit: No modification yet", 
      history: [], 
      isShowHistoryOpen: false
    }

    this.socket = io('localhost:3001');

    this.socket.on('RECEIVE_MESSAGE', function(data){
      addMessage(data);
    });

    this.socket.on('CHANGE_CURRENT_USER', function(data) {
      change_current_user(data);
    });

    this.socket.on('ADD_NEW_USER', function(data) {
      addNewUser(data);
    });

    this.socket.on('UPDATE_EDIT_MESSAGE', function(message_package) {
      update_edit_message(message_package);
    });

    const update_edit_message = message_package => {
      this.setState({
        edit_message: message_package.new_message, 
        history: message_package.history
      })
    }

    const addNewUser = data => {
      this.setState({
        history: data.history
      })
      change_current_user(data.current_users);
    }

    const change_current_user = data => {
      this.setState({
        users: data
      });
      let new_user_text = "Currently Online: ";
      for (var i = 0; i < this.state.users.length; i++) {
        if (i == this.state.users.length - 1) {
          new_user_text += this.state.users[i]
        } else {
          new_user_text += this.state.users[i] + ", "
        }
      }
      console.log("new array is: ", this.state.users)
      console.log("new text is: ", new_user_text)
      this.setState({
        user_text_block: new_user_text
      });
    }

    const addMessage = data => {
        console.log(data);
        let change_table = data.data
        // y, value, x
        for (var x = 0; x < change_table.length; x++) {
          let j = change_table[x][0] - 1   // 0 --> y_coord
          let value = change_table[x][1] // 1 --> actual value
          let i = change_table[x][2] - 1 // 2 --> x_coord
          console.log(i, ", ", j)
          if (i < data_display.length) {
            data_display[i][j] = value     // NOT UPDATING DATA_ORIGINAL!
            this.state.data_original[i][j] = value
          }

          // check buffer
          else if ((i + 1) < current_fetch_index) {
            i++; // change i and j to 1-based index
            if (buffer_copy[i + PREFETCH_SIZE - current_fetch_index][j] != value) {
              buffer_copy[i + PREFETCH_SIZE - current_fetch_index][j] = value  // update both buffer and buffer_copy
              buffer[i + PREFETCH_SIZE - current_fetch_index][j] = value
            }
          }
        }
        console.log("after socket, buffer_copy is: ", buffer_copy)
        this.setState({
          test_block: data.try_message
        });
    };

    this.toggleUserNamePrompt = this.toggleUserNamePrompt.bind()
    this.toggleShowHistory = this.toggleShowHistory.bind()
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

  componentWillUnmount() {
    this.socket.disconnect();
  }

  toggleShowHistory = () => {
    this.setState({
      isShowHistoryOpen: !this.state.isShowHistoryOpen
    })
  }

  toggleUserNamePrompt = () => {
    this.setState({
      isUserNamePromptOpen: !this.state.isUserNamePromptOpen
    })
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
    console.log(this.state.history)
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
        data:[], // 2d array to store difference: y, value, x, 
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

      // Update backend
      if (change_detected) {
        this.sendMessage(message)
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


  hangleUsername = (e) => {
    this.setState({
        [e.target.name]: e.target.value
    })
  }

  send_default_username = () => {
    let name_package = {
      user_name: "anonymous user"
    }
    this.socket.emit('SEND_USERNAME', name_package);
    this.toggleUserNamePrompt()
  }

  onUserNameSubmit = (e) => {
      e.preventDefault();
      console.log("call username")
      let name_package = {
        user_name: this.state.user_name
      }
      this.socket.emit('SEND_USERNAME', name_package);
      this.toggleUserNamePrompt();
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
                  <h1 className="display-3">Hi {this.state.user_name}, welcome to spreadsheet web!</h1>
                  <p className="lead">This is a simple web interface that allows you to upload spreadsheets and retrieve data.</p>
                  <hr className="my-2" />
                  {/* <p>Choose display data, or retrieve data from below</p> */}
                  <p>{this.state.user_text_block}</p>
                  <p className="lead">
                    <Button size='lg' className='redirect-button' color="primary" onClick={this.redirect_import} >To Import Page</Button> 
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Button size='lg' className='display-button' color="primary" onClick={this.display} >Display Dataset</Button> 
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {/* <Button size='lg' className='display-button' color="primary" onClick={this.show_state} >show state</Button>  */}
                    <Button size='lg' className='display-button' color="primary" onClick={this.toggleShowHistory} >Edit History</Button>
                  </p>
                  <p>{this.state.edit_message}</p>

                  <Modal size='lg' isOpen={this.state.isUserNamePromptOpen} >
                    <ModalHeader >Please enter your costomized username, or choose the default random username </ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.onUserNameSubmit}>
                        <FormGroup>
                          <Label for="user_name">Enter your username</Label>
                          <Input type="text" name="user_name" id="user_name" onChange={e => this.hangleUsername(e)} />
                        </FormGroup>
                        <Button size='lg' color="primary" className='single_search_submit' type="submit" >Confirm</Button> {' '}
                        <Button size='lg' color="primary" className='single_search_submit' onClick={this.send_default_username}>Default Username</Button> {' '}
                      </Form>
                    </ModalBody>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isShowHistoryOpen} toggle={this.toggleShowHistory}>
                    <ModalHeader toggle={this.toggleShowHistory}>File Edit History</ModalHeader>
                    <ModalBody>
                      <Table striped className="history-table">
                        <tbody>
                            {this.state.history.map(line => 
                              <tr key = {line}>
                                <td>{line}</td>
                              </tr>
                            )}
                        </tbody>
                      </Table>
                    </ModalBody>
                    <ModalFooter>
                      <Button size='lg' color="primary" className='single_search_submit' onClick={this.toggleShowHistory}>Close</Button> {' '}
                    </ModalFooter>
                  </Modal>
              
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
