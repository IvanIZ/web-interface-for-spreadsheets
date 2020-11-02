import React, { Component, useState } from 'react';
import ReactDOM from "react-dom"
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import logo from '../logo.svg';
import '../App.css';
import {ExcelRenderer, OutTable} from 'react-excel-renderer';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Container,
  Row,
  Col,
  Jumbotron,
  Nav,
  NavItem,
  NavLink,
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

// A JSON object that keeps track of previous layout changes
let layout_changes = {
  layout_changed: false,
  changes: [] // 1st element: action;  2nd element: index
}

let user_actions = []
let recorded_time = 0;

let SCROLL_SIZE = 5;

let data = [], dataMatrix = [], columns = [], buffer = [], buffer_copy = []
let PREFETCH_SIZE = 50
let noData = true
let ATT_NUM = 7
let prev_scrolltop = 0
let data_display = []
let chn_copy = []
let change_detected = false;

let current_fetch_index = 51 //initial pre-prefetch index
let num_attr = 0;

let current_i = -1;
let current_j = -1;
let currently_editing = false;

let conflict_i = -1;
let conflict_j = -1;
let incoming_value = "";
let conflict_message = "";

let select_i = -1; 
let select_j = -1;

let transaction_button = "";
let apply_read_only_lock_button = "";
let display_dataset_button = "";

let pending_changes = {
  data:[], // 2d array to store difference: y, value, x, 
  try_message: "SENT MESSAGE! SUCCESS!", 
  user: ""
}

let socket_id = "";

class Start extends Component {

  constructor() {
    super();
    this.id = "hot";
    this.hotTableComponent = React.createRef();
    this.state = {
      collapsed: false,
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
      isShowHistoryOpen: false, 

      isConflictModalOpen: false, 

      transaction_mode: false, 
      isSharedLockRejectOpen: false,
      isExclusiveLockRejectOpen: false
    }

    this.socket = io('localhost:3001');

    this.socket.on('RECEIVE_MESSAGE', function(data){
      addMessage(data);
    });

    this.socket.on('RECEIVE_ID', function(id){
      change_id(id);
    });

    this.socket.on('REQUEST_SHARED_REJECT', function(shared_lock_reject){
      toggleSharedLockReject(shared_lock_reject);
    });

    this.socket.on('REQUEST_SHARED_ACCEPT', function(shared_lock_accept){
      let row = shared_lock_accept.row;
      let col = shared_lock_accept.col;
      
      display_shared_lock(row, col);
    });

    this.socket.on('REQUEST_EXCLUSIVE_REJECT', function(exclusive_lock_reject){
      let row = exclusive_lock_reject.row;
      let col = exclusive_lock_reject.col;
      
      toggleExclusiveLockReject(row, col);
    });

    this.socket.on('REQUEST_EXCLUSIVE_ACCEPT', function(exclusive_lock_accept){
      let row = exclusive_lock_accept.row;
      let col = exclusive_lock_accept.col;
      let id = exclusive_lock_accept.id
      
      if (id !== socket_id) {
        display_exclusive_lock(row, col);
      }
    });

    this.socket.on('CHANGE_CURRENT_USER', function(data) {
      change_current_user(data);
    });

    this.socket.on('ADD_NEW_USER', function(data) {
      addNewUser(data);
    });

    this.socket.on('RECEIVE_FREED_CELLS', function(free_cells_package) {
      update_freed_cells(free_cells_package);
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

    const update_freed_cells = free_cells_package => {

      let free_cells = free_cells_package.free_cells;
      let disconnect = free_cells_package.disconnect;

      console.log("the free cells are ", free_cells);

      for (var i = 0; i < free_cells.length; i++) {
        let location = free_cells[i];
        if (location[0] < data_display.length) {
          
          let cell_data = this.hotTableComponent.current.hotInstance.getDataAtCell(location[0], location[1]);

          // update read-only cells
          if (cell_data[0] == "*") {
            let new_data = cell_data.substring(1);
            this.hotTableComponent.current.hotInstance.setDataAtCell(location[0], location[1], new_data);
          }

          if (cell_data == "-----" && disconnect == true) {
            data_display[location[0], location[1]] = this.state.data_original[location[0], location[1]];
          }
        }
      }
      cell_read_only();
    }

    const change_id = id => {
      socket_id = id;
    }

    const addNewUser = data => {
      this.setState({
        history: data.history
      })
      change_current_user(data.current_users);
    }

    const cell_read_only = () => {
      console.log("setting to read only...")
      this.hotTableComponent.current.hotInstance.updateSettings({
        cells: function(row, col, prop){
         var cellProperties = {};
           if(data_display[row][col] !== null && (data_display[row][col] == "-----" || data_display[row][col].charAt(0) === "*")){
             cellProperties.readOnly = 'true'
           }
         return cellProperties
       }
     })
    }

    const display_shared_lock = (row, col) => {
      if (row < data_display.length) {
  
        let cell_data = this.hotTableComponent.current.hotInstance.getDataAtCell(row, col);
  
        // if there is a shared lock displaying already, do nothing
        if (cell_data.charAt(0) === "*") {
          return;
        } else {
          let new_data = "*" + cell_data
          this.hotTableComponent.current.hotInstance.setDataAtCell(row, col, new_data);
        }
        cell_read_only();
      }
    }

    const display_exclusive_lock = (row, col) => {
      if (row < data_display.length) {
        console.log(row)
        console.log(col)
        let new_value = "-----";
        this.hotTableComponent.current.hotInstance.setDataAtCell(row, col, new_value);
        cell_read_only();
      }
    }

    const toggleSharedLockReject = data => {
      this.setState({
        isSharedLockRejectOpen: !this.state.isSharedLockRejectOpen
      })
    }

    const toggleExclusiveLockReject = data => {
      this.setState({
        isExclusiveLockRejectOpen: !this.state.isExclusiveLockRejectOpen
      })
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
      this.setState({
        user_text_block: new_user_text
      });
    }

    const addMessage = data => {

        let change_table = data.data
        for (var x = 0; x < change_table.length; x++) {
          // Extract data
          let j = change_table[x][0] - 1   // 0 --> y_coord
          let value = change_table[x][1] // 1 --> actual value
          let i = change_table[x][2] - 1 // 2 --> x_coord

          // Update spreadsheet
          if (i < data_display.length) {
            data_display[i][j] = value     
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
    this.toggleConflictModal = this.toggleConflictModal.bind()
    this.toggleNavbar = this.toggleNavbar.bind()
    this.toggleSharedLockReject = this.toggleSharedLockReject.bind();
    this.toggleExclusiveLockReject = this.toggleExclusiveLockReject.bind();
  }

  // fetch 50 rows of data into the buffer
  async componentDidMount() {
    recorded_time = Date.now() / 1000;

    display_dataset_button = <Button size='lg' className='display-button' color="primary" onClick={this.display} >Display Dataset</Button> 

    this.hotTableComponent.current.hotInstance.addHook('afterChange', function(chn, src) {
      if (src === 'edit') {
        console.log(chn);
        
        // call check_cell_change if original and new data differ
        if (chn[0][2] !== chn[0][3] && chn[0][3].charAt(0) !== "*" && chn[0][3] !== "-----") {
          console.log("differ!");
          chn_copy = chn;
          change_detected = true;

          // remove currently editing state
          current_i = -1;
          current_j = -1;
          currently_editing = false;
        }
      }
    });

    this.hotTableComponent.current.hotInstance.addHook('afterBeginEditing', function(row, col) {

      // record the currently editing location and state. 
      current_i = row;
      current_j = col;
      // currently_editing = true;
      // console.log("current editing ", current_i, current_j);
    });

    this.hotTableComponent.current.hotInstance.addHook('afterSelection', function(row, column, row2, column2, preventScrolling, selectionLayerLevel) {

      // record the currently editing location and state. 
      select_i = row;
      select_j = column;
      // console.log(select_i, select_j);
      currently_editing = true;
    });

    this.hotTableComponent.current.hotInstance.addHook('afterCreateRow', function(index, amount, source) {
      console.log("insert index is: ", index);
      if (source == "ContextMenu.rowBelow") {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_r", "below", index]);
      } else {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_r", "above", index]);
      }
    });

    this.hotTableComponent.current.hotInstance.addHook('afterCreateCol', function(index, amount, source) {
      console.log("insert index is: ", index);
      if (source == "ContextMenu.columnRight") {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_c", "right", index]);
      } else {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_c", "left", index]);
      }
    });

    this.hotTableComponent.current.hotInstance.addHook('afterRemoveRow', function(index, amount, physicalRows, source) {
      layout_changes.layout_changed = true;
      layout_changes.changes.push(["remove_r", null, index]);
      // console.log("index: ", index);
      // console.log("amount: ", amount);
      // console.log("source: ", source);
    });

    this.hotTableComponent.current.hotInstance.addHook('afterRemoveCol', function(index, amount, physicalRows, source) {
      layout_changes.layout_changed = true;
      layout_changes.changes.push(["remove_c", null, index]);
      // console.log("index: ", index);
      // console.log("amount: ", amount);
      // console.log("source: ", source);
    });

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

  request_shared_lock = () => {
    // send request for a shared lock to backend
    let shared_lock_request = {
      row: select_i,
      col: select_j
    }
    this.socket.emit('REQUEST_SHARED_LOCK', shared_lock_request);
  }

  request_exclusive_lock = (i, j) => {
    // send request for a exclusive lock to backend
    let exclusive_lock_request = {
      row: i,
      col: j
    }
    this.socket.emit('REQUEST_EXCLUSIVE_LOCK', exclusive_lock_request);
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  toggleNavbar = () => {
    this.setState({
      collapsed: !this.state.collapsed
    })
  }

  toggleExclusiveLockReject = () => {
    this.setState({
      isExclusiveLockRejectOpen: !this.state.isExclusiveLockRejectOpen
    })
  }

  toggleSharedLockReject = () => {
    this.setState({
      isSharedLockRejectOpen: !this.state.isSharedLockRejectOpen
    })
  }

  toggleConflictModal = () => {
    this.setState({
      isConflictModalOpen: !this.state.isConflictModalOpen
    })
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
    display_dataset_button = "";
    if (this.state.transaction_mode) {
      transaction_button = <Button size='lg' className='display-button' color="primary" onClick={this.end_transaction} >End Transaction</Button> 
    } else {
      transaction_button = <Button size='lg' className='display-button' color="primary" onClick={this.start_transaction} >Start Transaction</Button>
    }
    this.setState({
      data_original: this.state.data_original.concat(buffer)
    })
    data_display = data_display.concat(buffer_copy) 
    this.fetchMoreRows(current_fetch_index)
    current_fetch_index += 50
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
    prev_scrolltop = e.target.scrollTop;
  }

  show_state = () => {
    console.log(chn_copy);
    console.log(change_detected);
  }

  sendMessage = (message) => {
    this.socket.emit('SEND_MESSAGE', message);
  }

  check_cell_change = () => {
    // create a message to socket
    if (change_detected) {

      // find current state
      let state = "Y"; //  Y means in a transaction
      if (!this.state.transaction_mode) {
        state = "N";
      }

      // extract features of the new value
      let feature = "";
      if (isNaN(chn_copy[0][3])) {
        feature = "STR";
      } else {
        feature = "DIGIT";
      }

      // record user action
      user_actions.push(["edit_cell", chn_copy[0][0], chn_copy[0][1], state, feature]);

      console.log("chn_copy is check cell change is===============================: ", chn_copy);
      this.request_exclusive_lock(chn_copy[0][0], chn_copy[0][1]);
      
      pending_changes.user = this.state.user_name
  
      let temp = [];
      let y_coord = parseInt(chn_copy[0][0]) + 1;
      let x_coord = parseInt(chn_copy[0][1]) + 1;
      let actual_value = chn_copy[0][3];
      temp[0] = x_coord;
      temp[1] = actual_value;
      temp[2] = y_coord;
      pending_changes.data.push(temp);
      console.log("pending changes are000: ", pending_changes)
      // this.state.data_original[y_coord - 1][x_coord - 1] = actual_value; // not sure if we need this anymore
      change_detected = false;
    } else {
      console.log("no changed detected")
    }
  }

  cell_read_only = (input_row, input_col) => {
    // this.hotTableComponent.current.hotInstance.setDataAtCell(row, col, new_value);
    this.hotTableComponent.current.hotInstance.updateSettings({
      cells: function(row, col, prop){
       var cellProperties = {};
         if(row == input_row && col == input_col){
           cellProperties.readOnly = 'true'
         }
       return cellProperties
     }
   })
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

  resolve_conflict = (e) => {
      e.preventDefault();
      data_display[conflict_i][conflict_j] = incoming_value;
      this.state.data_original[conflict_i][conflict_j] = incoming_value;

      // reset conflict records
      conflict_i = -1;
      conflict_j = -1;
      incoming_value = -1;
      conflict_message = "";
      this.toggleConflictModal();
  }

  start_transaction = () => {
    pending_changes.data = []
    this.setState({
      transaction_mode: true
    })
    transaction_button = <Button size='lg' className='display-button' color="primary" onClick={this.end_transaction} >End Transaction</Button> 
    //apply_read_only_lock_button = <Button size='lg' className='display-button' color="primary" onClick={this.request_shared_lock} >Apply Read-Only Lock</Button> 
  }

  commit_transaction = () => {
      console.log("pending changes are111: ", pending_changes);
      if (pending_changes.data.length > 0) {
        // Send update message to socket and backend
        this.sendMessage(pending_changes)
        //POST req here
        const requestOptions = {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({pending_changes})
        };
        fetch('/database/update-content', requestOptions)
      }
  }

  end_transaction = () => {
    setTimeout(() => {
      this.commit_transaction();
    }, 500);
    this.setState({
      transaction_mode: false
    })
    transaction_button = <Button size='lg' className='display-button' color="primary" onClick={this.start_transaction} >Start Transaction</Button>
    //apply_read_only_lock_button = "";

    // tell the backend that transaction is completed
    this.socket.emit('FINISH_TRANSACTION');
  }

  track_action = (e, action_type) => {

    // find current state
    let state = "Y"; //  Y means in a transaction
    if (!this.state.transaction_mode) {
      state = "N";
    }

    // calculate idle time and record idle action if necessary
    let idle_duration = (Date.now() / 1000) - recorded_time;
    recorded_time = (Date.now() / 1000);
    if (idle_duration > 3) {

      // check if we can merge two idle periods together
      if (user_actions.length > 0 && user_actions[user_actions.length - 1][0] == "idle") {
        let prev_idle_time = user_actions[user_actions.length - 1][1];
        user_actions.pop();
        user_actions.push(["idle", parseInt(idle_duration) + prev_idle_time, state]);
      } else {
        user_actions.push(["idle", parseInt(idle_duration), state]);
      }
    }

    // check and update possible spreadsheet layout change
    if (layout_changes.layout_changed) { 
      
      // remove prev idle action
      if (user_actions.length > 0 && user_actions[user_actions.length - 1][0] == "idle") {
        user_actions.pop();
      }

      // add in all layout changes
      for (var i = 0; i < layout_changes.changes.length; i++) {
        let layout_change_type = layout_changes.changes[i][0];
        let layout_change_direction = layout_changes.changes[i][1];
        let change_index = layout_changes.changes[i][2];
        user_actions.push([layout_change_type, change_index, layout_change_direction, state]);
      }

      // clear up current layout_changes recorder
      layout_changes.changes.length = 0;
      layout_changes.layout_changed = false;
    }

    // handle scroll actions
    if (action_type == "scroll") {

      let scroll_diff = prev_scrolltop - e.target.scrollTop;
      let action_length = user_actions.length;

      // don't hace scroll_diff === 0 because each scroll on mouse will result in two identical function calls
      if (scroll_diff > 0) {
        
        // check if previous is a large up scroll. If so, do nothing
        if (action_length >= 1 && user_actions[action_length - 1][0] === "up_scroll_l") {
          // deliberately do nothing here
        }

        // check for combining 6 small up scrolls
        else if (action_length >= SCROLL_SIZE) {
          let combine = true;
          for (var i = 0; i < SCROLL_SIZE; i++) {
              if (user_actions[action_length - 1 - i][0] !== "up_scroll_s") {
                combine = false;
                break;
              }
          }

          if (combine) {
            for (var i = 0; i < SCROLL_SIZE; i++) {
                user_actions.pop();
            }
            user_actions.push(["up_scroll_l", null, null, state]);
          }

          else {
            user_actions.push(["up_scroll_s", null, null, state]);
          }
        }

        else {
          user_actions.push(["up_scroll_s", null, null, state]);
        }

      } else if (scroll_diff < 0) {

        // check if previous is a large down scroll. If so, do nothing
        if (action_length >= 1 && user_actions[action_length - 1][0] === "down_scroll_l") {
            // deliberately do nothing here
        }

        // check for combining 6 small scrolls
        else if (action_length >= SCROLL_SIZE) {
          let combine = true;
          for (var i = 0; i < SCROLL_SIZE; i++) {
              if (user_actions[action_length - 1 - i][0] !== "down_scroll_s") {
                combine = false;
                break;
              }
          }
          
          if (combine) {
            for (var i = 0; i < SCROLL_SIZE; i++) {
                user_actions.pop();
            }
            user_actions.push(["down_scroll_l", null, null, state]);
          }

          else {
            user_actions.push(["down_scroll_s", null, null, state]);
          }
        } 

        else {
          user_actions.push(["down_scroll_s", null, null, state]);
        }
      }
      this.handleScroll(e);
    }

    // calculate click action
    else if (action_type == "click") {

      if (currently_editing && this.state.transaction_mode) {
        
        // select a row
        if (select_j < 0) {
          user_actions.push(["select_r", select_i, null, state]);
        }

        // select a column
        else if (select_i < 0) {
          user_actions.push(["select_c", select_j, null, state]);
        }
        
        // select a cell
        else {
          user_actions.push([action_type, select_i, select_j, state]);
        }
        currently_editing = false;
      }
      this.check_cell_change();
    }

    // calculate kepress action
    else if (action_type == "key_press") {

      if (change_detected) {
        // handle enter press
        if (e.key == "Enter") {
          user_actions.push(["keyPress_enter", chn_copy[0][0], chn_copy[0][1], state]);
        }

        // handle tab press
        else if (e.key == "Tab") {
          user_actions.push(["keyPress_tab", chn_copy[0][0], chn_copy[0][1], state]);
        }

        // all other press 
        else {
          user_actions.push(["keyPress", chn_copy[0][0], chn_copy[0][1], state]);
        }
      }
      this.check_cell_change();
    }
    console.log(user_actions);
  }

  render() {
    if (this.state.redirect_import_page) {
      return <Redirect to={this.state.import_page_link} />
    }
    return (
      <div onClick={e => this.track_action(e, "click")} onKeyUp={e => this.track_action(e, "key_press")} className="App">
        <script src="node_modules/handsontable/dist/handsontable.full.min.js"></script>
        <link href="node_modules/handsontable/dist/handsontable.full.min.css" rel="stylesheet" media="screen"></link>
         <Jumbotron className='logo-jumbo'>
          </Jumbotron >
          <div>
          <Jumbotron >
            {/* <Container fluid> */}
                <Navbar color="faded" light>
                  <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
                  <Collapse isOpen={this.state.collapsed} navbar>
                    <Nav tabs>
                      <NavItem>
                        <NavLink href="/result">Import Page</NavLink>
                      </NavItem>
                    </Nav>
                  </Collapse>
                </Navbar>
                  <h1 className="display-3">Hi {this.state.user_name}, welcome to spreadsheet web!</h1>
                  <p className="lead">This is a simple web interface that allows you to upload spreadsheets and retrieve data.</p>
                  <hr className="my-2" />
                  <p>{this.state.user_text_block}</p>
                  <p className="lead">
                    <Button size='lg' className='display-button' color="info" onClick={this.toggleShowHistory} >Edit History</Button>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {display_dataset_button}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {transaction_button}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {apply_read_only_lock_button}
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

                  <Modal size='lg' isOpen={this.state.isConflictModalOpen} toggle={this.toggleConflictModal}>
                    <ModalHeader toggle={this.toggleConflictModal}>Conflicting Incoming Changes from Other Users </ModalHeader>
                    <ModalBody>
                      {conflict_message}
                    </ModalBody>
                    <ModalFooter>
                      <Button size='lg' color="primary" className="btn btn-primary btn-sm" onClick={this.resolve_conflict} block>Accept Incoming Changes</Button> {' '}
                      <Button size='lg' color="secondary" className="btn btn-primary btn-sm" onClick={this.toggleConflictModal} block>Ignore Incoming Changes</Button>
                    </ModalFooter>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isSharedLockRejectOpen} toggle={this.toggleSharedLockReject}>
                    <ModalHeader toggle={this.toggleSharedLockReject}>Lock Request Rejection </ModalHeader>
                    <ModalBody>
                      Cannot place a read-only lock on a cell with an exclusive lock!
                    </ModalBody>
                    <ModalFooter>
                      <Button size='lg' color="primary" className="btn btn-primary btn-sm" onClick={this.toggleSharedLockReject} block>Got it</Button> {' '}
                    </ModalFooter>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isExclusiveLockRejectOpen} toggle={this.toggleExclusiveLockReject}>
                    <ModalHeader toggle={this.toggleExclusiveLockReject}>Lock Request Rejection </ModalHeader>
                    <ModalBody>
                      Cannot place an exclusive lock on a cell with a lock already! 
                    </ModalBody>
                    <ModalFooter>
                      <Button size='lg' color="primary" className="btn btn-primary btn-sm" onClick={this.toggleExclusiveLockReject} block>Got it</Button> {' '}
                    </ModalFooter>
                  </Modal>
            {/* </Container> */}
        </Jumbotron>
        </div>

        <hr />
        Below Is The Entire Data Set  
        {/* <div id = "display_portion" onClick={this.check_cell_change} onKeyUp={this.check_cell_change} onScroll={this.handleScroll}  tabIndex="1"> */}
        <div id = "display_portion" onScroll={e => this.track_action(e, "scroll")}  tabIndex="1">
          <HotTable className="handsontable" id ="display_table" data={data_display} ref={this.hotTableComponent} id={this.id}
            colHeaders={true} 
            rowHeaders={true} 
            width="100%" 
            height="300"
            colWidths="100%"
            rowHeights="25"
            contextMenu={true}
            formulas={true}
            readOnly={!this.state.transaction_mode}
            />
        </div>
          
      </div>

    );
  }
}
export default Start;
