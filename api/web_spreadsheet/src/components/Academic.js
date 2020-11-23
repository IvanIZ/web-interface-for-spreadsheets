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
  Table, Modal, ModalHeader, ModalFooter, ModalBody, Form, FormGroup, Label, Input, ListGroup, Card, CardTitle, CardText, TabContent, TabPane, ButtonDropdown, Dropdown, DropdownToggle, DropdownMenu, DropdownItem
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
import classnames from 'classnames';

const Utils = require('../utils');
let utils = new Utils();

let attendance_display = [];
let greadebook_display = [];
let student_status_display = [];

//default order: 6
const BPlusTree = require('bplustree');
let tree = new BPlusTree()

let simulation_type = "";

// A JSON object that keeps track of previous layout changes
let layout_changes = {
  layout_changed: false,
  changes: [] // 1st element: action;  2nd element: index
}

let col_headers = []
let attendance_col_headers = [];
let grade_book_col_headers = [];
let student_status_col_headers = [];
let table_loaded = false;

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

let current_fetch_index = 1 //initial pre-prefetch index
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

let ref1 = "";
let ref2 = "";
let ref3 = "";

class Academic extends Component {

  constructor() {
    super();
    this.id = "hot";
    this.hotTableComponent = React.createRef();
    this.hotTableComponent1 = React.createRef();
    this.hotTableComponent2 = React.createRef();
    this.state = {
      collapsed: false,
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

      isSelectPromptOpen: true, 
      user_name: "", 

      edit_message: "Last Edit: No modification yet", 
      history: [], 
      isShowHistoryOpen: false, 

      transaction_mode: false, 
      isSharedLockRejectOpen: false,
      isExclusiveLockRejectOpen: false, 

      isInstructionOpen: true,
      activeTab: '1', 

      redirect_link: "", 
      isRedirectConfirmOpen: false, 
      redirect: false, 

      isNameModalOpen: false, 
      name: "", 
      curr_table: "attendance", 

      isRestartModalOpen: false
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

    this.socket.on('UPDATE_EDIT_MESSAGE', function(message_package) {
      update_edit_message(message_package);
    });

    const update_edit_message = message_package => {
      this.setState({
        edit_message: message_package.new_message, 
        history: message_package.history
      })
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
         console.log("undefined is: ", data_display[row][col], " ", row, " ", col)
           if(data_display[row][col] !== null && data_display[row][col].length !== 0 &&  (data_display[row][col] == "-----" || data_display[row][col].charAt(0) === "*")){
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

    this.toggleSelectionPrompt = this.toggleSelectionPrompt.bind()
    this.toggleShowHistory = this.toggleShowHistory.bind()
    this.toggleNavbar = this.toggleNavbar.bind()
    this.toggleExclusiveLockReject = this.toggleExclusiveLockReject.bind();
    this.toggleInstructionModal = this.toggleInstructionModal.bind();
    this.toggleRedirectConfirmModal = this.toggleRedirectConfirmModal.bind();
    this.toggleNameModal = this.toggleNameModal.bind();
    this.toggleRestartModal = this.toggleRestartModal.bind();
  }

  // fetch 50 rows of data into the buffer
  async componentDidMount() {

    recorded_time = Date.now() / 1000;

    // display_dataset_button = <Button size='lg' className='display-button' color="primary" onClick={this.display} >Display Dataset</Button> 
    transaction_button = <Button size='lg' className='display-button' color="primary" onClick={this.start_transaction} >Start Transaction</Button>


    // FIRST COMPONENT REF ========================================================================================
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
    });

    this.hotTableComponent.current.hotInstance.addHook('afterSelection', function(row, column, row2, column2, preventScrolling, selectionLayerLevel) {

      // record the currently editing location and state. 
      select_i = row;
      select_j = column;
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
    });

    this.hotTableComponent.current.hotInstance.addHook('afterRemoveCol', function(index, amount, physicalRows, source) {
      layout_changes.layout_changed = true;
      layout_changes.changes.push(["remove_c", null, index]);
    });

    // SECOND COMPONENT REF ========================================================================================
    this.hotTableComponent1.current.hotInstance.addHook('afterChange', function(chn, src) {
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

    this.hotTableComponent1.current.hotInstance.addHook('afterBeginEditing', function(row, col) {

      // record the currently editing location and state. 
      current_i = row;
      current_j = col;
    });

    this.hotTableComponent1.current.hotInstance.addHook('afterSelection', function(row, column, row2, column2, preventScrolling, selectionLayerLevel) {

      // record the currently editing location and state. 
      select_i = row;
      select_j = column;
      currently_editing = true;
    });

    this.hotTableComponent1.current.hotInstance.addHook('afterCreateRow', function(index, amount, source) {
      console.log("insert index is: ", index);
      if (source == "ContextMenu.rowBelow") {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_r", "below", index]);
      } else {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_r", "above", index]);
      }
    });

    this.hotTableComponent1.current.hotInstance.addHook('afterCreateCol', function(index, amount, source) {
      console.log("insert index is: ", index);
      if (source == "ContextMenu.columnRight") {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_c", "right", index]);
      } else {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_c", "left", index]);
      }
    });

    this.hotTableComponent1.current.hotInstance.addHook('afterRemoveRow', function(index, amount, physicalRows, source) {
      layout_changes.layout_changed = true;
      layout_changes.changes.push(["remove_r", null, index]);
    });

    this.hotTableComponent1.current.hotInstance.addHook('afterRemoveCol', function(index, amount, physicalRows, source) {
      layout_changes.layout_changed = true;
      layout_changes.changes.push(["remove_c", null, index]);
    });

    // THIRD COMPONENT REF ========================================================================================
    this.hotTableComponent2.current.hotInstance.addHook('afterChange', function(chn, src) {
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

    this.hotTableComponent2.current.hotInstance.addHook('afterBeginEditing', function(row, col) {

      // record the currently editing location and state. 
      current_i = row;
      current_j = col;
    });

    this.hotTableComponent2.current.hotInstance.addHook('afterSelection', function(row, column, row2, column2, preventScrolling, selectionLayerLevel) {

      // record the currently editing location and state. 
      select_i = row;
      select_j = column;
      currently_editing = true;
    });

    this.hotTableComponent2.current.hotInstance.addHook('afterCreateRow', function(index, amount, source) {
      console.log("insert index is: ", index);
      if (source == "ContextMenu.rowBelow") {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_r", "below", index]);
      } else {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_r", "above", index]);
      }
    });

    this.hotTableComponent2.current.hotInstance.addHook('afterCreateCol', function(index, amount, source) {
      console.log("insert index is: ", index);
      if (source == "ContextMenu.columnRight") {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_c", "right", index]);
      } else {
        layout_changes.layout_changed = true;
        layout_changes.changes.push(["insert_c", "left", index]);
      }
    });

    this.hotTableComponent2.current.hotInstance.addHook('afterRemoveRow', function(index, amount, physicalRows, source) {
      layout_changes.layout_changed = true;
      layout_changes.changes.push(["remove_r", null, index]);
    });

    this.hotTableComponent2.current.hotInstance.addHook('afterRemoveCol', function(index, amount, physicalRows, source) {
      layout_changes.layout_changed = true;
      layout_changes.changes.push(["remove_c", null, index]);
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  toggleRestartModal = () => {
    this.setState({
      isRestartModalOpen: !this.state.isRestartModalOpen
    })
  }

  toggleNameModal = () => {
    this.setState({
      isNameModalOpen: !this.state.isNameModalOpen
    })
  }

  toggleRedirectConfirmModal = () => {
    this.setState({
      isRedirectConfirmOpen: !this.state.isRedirectConfirmOpen
    })
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

  toggleShowHistory = () => {
    this.setState({
      isShowHistoryOpen: !this.state.isShowHistoryOpen
    })
  }

  toggleSelectionPrompt = () => {
    this.setState({
        isSelectPromptOpen: !this.state.isSelectPromptOpen
    })
  }

  toggleInstructionModal = () => {
      this.setState({
          isInstructionOpen: !this.state.isInstructionOpen
      })
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

    // fill in column headers and row headers
    if (data_display.length == 0) {
      data_display.push(col_headers);
    }
    data_display = data_display.concat(buffer_copy) 
    console.log("data display is: ", data_display);
  }

  redirect_import = () => {
    this.setState( {
      redirect_import_page: true
    })
  }

  handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) {
      // this.display()
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
      user_actions.push([this.state.name, "edit_cell", chn_copy[0][0], chn_copy[0][1], feature, this.state.curr_table, chn_copy[0][0] + 1, col_headers[chn_copy[0][1]], state]);
      
      pending_changes.user = this.state.user_name
  
      let temp = [];
      let y_coord = parseInt(chn_copy[0][0]) + 1;
      let x_coord = parseInt(chn_copy[0][1]) + 1;
      let actual_value = chn_copy[0][3];
      temp[0] = x_coord;
      temp[1] = actual_value;
      temp[2] = y_coord;
      pending_changes.data.push(temp);
      change_detected = false;
    } else {
      console.log("no changed detected")
    }
  }

  cell_read_only = (input_row, input_col) => {
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

  onSelectionSubmit = (e) => {
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

  end_transaction = () => {
    // setTimeout(() => {
    //   this.commit_transaction();
    // }, 500);
    this.setState({
      transaction_mode: false
    })
    transaction_button = <Button size='lg' className='display-button' color="primary" onClick={this.start_transaction} >Start Transaction</Button>
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
      if (user_actions.length > 0 && user_actions[user_actions.length - 1][1] == "idle") {
        let prev_idle_time = user_actions[user_actions.length - 1][2];
        user_actions.pop();
        user_actions.push([this.state.name, "idle", parseInt(idle_duration) + prev_idle_time, null, null, this.state.curr_table, null, null, state]);
      } else {
        user_actions.push([this.state.name, "idle", parseInt(idle_duration), null, null, this.state.curr_table, null, null, state]);
      }
    }

    // check and update possible spreadsheet layout change
    if (layout_changes.layout_changed) { 
      
      // remove prev idle action
      if (user_actions.length > 0 && user_actions[user_actions.length - 1][1] == "idle") {
        user_actions.pop();
      }

      // add in all layout changes
      for (var i = 0; i < layout_changes.changes.length; i++) {
        let layout_change_type = layout_changes.changes[i][0];
        let layout_change_direction = layout_changes.changes[i][1];
        let change_index = layout_changes.changes[i][2];
        user_actions.push([this.state.name, layout_change_type, change_index, layout_change_direction, null, this.state.curr_table, null, null, state]); 
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
        if (action_length >= 1 && user_actions[action_length - 1][1] === "up_scroll_l") {
          // deliberately do nothing here
        }

        // check for combining 6 small up scrolls
        else if (action_length >= SCROLL_SIZE) {
          let combine = true;
          for (var i = 0; i < SCROLL_SIZE; i++) {
              if (user_actions[action_length - 1 - i][1] !== "up_scroll_s") {
                combine = false;
                break;
              }
          }

          if (combine) {
            for (var i = 0; i < SCROLL_SIZE; i++) {
                user_actions.pop();
            }
            user_actions.push([this.state.name, "up_scroll_l", null, null, null, this.state.curr_table, null, null, state]);
          }

          else {
            user_actions.push([this.state.name, "up_scroll_s", null, null, null, this.state.curr_table, null, null, state]);
          }
        }

        else {
          user_actions.push([this.state.name, "up_scroll_s", null, null, null, this.state.curr_table, null, null, state]);
        }

      } else if (scroll_diff < 0) {

        // check if previous is a large down scroll. If so, do nothing
        if (action_length >= 1 && user_actions[action_length - 1][1] === "down_scroll_l") {
            // deliberately do nothing here
        }

        // check for combining 6 small scrolls
        else if (action_length >= SCROLL_SIZE) {
          let combine = true;
          for (var i = 0; i < SCROLL_SIZE; i++) {
              if (user_actions[action_length - 1 - i][1] !== "down_scroll_s") {
                combine = false;
                break;
              }
          }
          
          if (combine) {
            for (var i = 0; i < SCROLL_SIZE; i++) {
                user_actions.pop();
            }
            user_actions.push([this.state.name, "down_scroll_l", null, null, null, this.state.curr_table, null, null, state]);
          }

          else {
            user_actions.push([this.state.name, "down_scroll_s", null, null, null, this.state.curr_table, null, null, state]);
          }
        } 

        else {
          user_actions.push([this.state.name, "down_scroll_s", null, null, null, this.state.curr_table, null, null, state]);
        }
      }
      this.handleScroll(e);
    }

    // calculate click action
    else if (action_type == "click") {

      if (currently_editing) {
        
        // select a row
        if (select_j < 0) {
          user_actions.push([this.state.name, "select_r", select_i, null, null, this.state.curr_table, null, null, state]);
        }

        // select a column
        else if (select_i < 0) {
          user_actions.push([this.state.name, "select_c", select_j, null, null, this.state.curr_table, null, null, state]);
        }
        
        // select a cell
        else {
          user_actions.push([this.state.name, action_type, select_i, select_j, null, this.state.curr_table, select_i + 1, col_headers[select_j], state]);
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
          user_actions.push([this.state.name, "keyPress_enter", chn_copy[0][0], chn_copy[0][1], null, this.state.curr_table, chn_copy[0][0] + 1, col_headers[chn_copy[0][1]], state ]);
        }

        // handle tab press
        else if (e.key == "Tab") {
          user_actions.push([this.state.name, "keyPress_tab", chn_copy[0][0], chn_copy[0][1], null, this.state.curr_table, chn_copy[0][0] + 1, col_headers[chn_copy[0][1]], state]);
        }

        // all other press 
        else {
          user_actions.push([this.state.name, "keyPress", chn_copy[0][0], chn_copy[0][1], null, this.state.curr_table, chn_copy[0][0] + 1, col_headers[chn_copy[0][1]], state]);
        }
      }
      this.check_cell_change();
    }
    console.log(user_actions);
  }

  store_training_data = () => {
    user_actions.push([this.state.name, "END_TRAINING_DATA", null, null, null, this.state.curr_table, null, null, "END"]);
    let action_package = {
      user_actions: user_actions
    }
    //POST req here
    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action_package})
    };
    fetch('/training/send-training-data/academic', requestOptions)
  }

  select_simulation = (e) => {
    // e.preventDefault();
    console.log("called this function with: ", e.target.name)
    if (e.target.name == "academic") {
      this.setState({
        redirect_link: '/academic'
      })
    }
    if (e.target.name == "financing") {
      this.setState({
        redirect_link: '/financing'
      })
    }
    if (e.target.name == "management") {
      this.setState({
        redirect_link: '/management'
      })
    }
    this.toggleRedirectConfirmModal();
  }

  toggle = (tab) => {
    if (this.state.activeTab !== tab) {
        this.setState({ activeTab: tab });
    }
    if (tab === '1') {  
      this.setState({
        curr_table: "attendance" 
      })
      col_headers = attendance_col_headers;
      
    } else if (tab === '2') {
      this.setState({
        curr_table: "cs225_gradebook"
      })
      col_headers = grade_book_col_headers;

    } else if (tab === '3') {
      this.setState({
        curr_table: "student_status"
      })
      col_headers = student_status_col_headers
    }
  }

  load_tables = (e) => {
    e.preventDefault();
    if (table_loaded) {
      this.toggleInstructionModal();
    } else {
      table_loaded = true;
      utils.load_simulation_v2(1, "attendance", attendance_display, buffer_copy, attendance_col_headers);
      utils.load_simulation_v2(1, "grade_book", greadebook_display, buffer_copy, grade_book_col_headers);
      utils.load_simulation_v2(1, "student_status", student_status_display, buffer_copy, student_status_col_headers);
      setTimeout(() => {
          attendance_display = [attendance_col_headers].concat(attendance_display);
          greadebook_display = [grade_book_col_headers].concat(greadebook_display);
          student_status_display = [student_status_col_headers].concat(student_status_display);
          // this.toggleInstructionModal();
          this.setState({
            isInstructionOpen: false
          })
      }, 500);
      col_headers = attendance_col_headers;
      // this.toggleNameModal();
      this.setState({
        isNameModalOpen: false
      })
    }
  }

  reload_tables = () => {
    table_loaded = true;
    utils.load_simulation_v2(1, "attendance", attendance_display, buffer_copy, attendance_col_headers);
    utils.load_simulation_v2(1, "grade_book", greadebook_display, buffer_copy, grade_book_col_headers);
    utils.load_simulation_v2(1, "student_status", student_status_display, buffer_copy, student_status_col_headers);
    setTimeout(() => {
        attendance_display = [attendance_col_headers].concat(attendance_display);
        greadebook_display = [grade_book_col_headers].concat(greadebook_display);
        student_status_display = [student_status_col_headers].concat(student_status_display);
    }, 500);
    col_headers = attendance_col_headers;
  }

  redirect = (e) => {
    e.preventDefault();
    this.setState({
      redirect: true
    })
  }

  onNameSubmit = (e) => {
    this.setState({
        [e.target.name]: e.target.value
    })
  }

  submitName = (e) => {
    e.preventDefault();
    console.log("state name is: ", this.state.name);
    this.toggleNameModal();
  }

  restart = () => {
    // reset all display
    attendance_display = [];
    greadebook_display = [];
    student_status_display = [];
    attendance_col_headers = [];
    grade_book_col_headers = [];
    student_status_col_headers = [];

    // reload all tables
    this.reload_tables();

    // clear recorded actions
    user_actions = [];

    // set tab
    this.setState({
      activeTab: '1'
    })
    this.toggle('1');

    // toggle restart confirmation
    this.toggleRestartModal();
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to={this.state.redirect_link} />
    }
    return (

      <div onClick={e => this.track_action(e, "click")} onKeyUp={e => this.track_action(e, "key_press")} className="App">
        <script src="node_modules/handsontable/dist/handsontable.full.min.js"></script>
        <link href="node_modules/handsontable/dist/handsontable.full.min.css" rel="stylesheet" media="screen"></link>
         <Jumbotron className='logo-jumbo'>
          <ButtonDropdown isOpen={this.state.collapsed} toggle={this.toggleNavbar} style={{float: 'left'}} className="up-margin-one">
                <DropdownToggle color="#61dafb"  caret style={{float: 'right'}}>
                  Change Simulation
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem name="financing" id="financing" onClick={e => this.select_simulation(e)}>Financing Simulation</DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem name="management" id="management" onClick={e => this.select_simulation(e)}>Management Simulation</DropdownItem>
                </DropdownMenu>
            </ButtonDropdown>
          </Jumbotron >
          <div>
            <Jumbotron >
                  <h1 className="display-3">Hi {this.state.user_name}, welcome to Academic Simulation!</h1>
                  <p className="lead">This is a simple web interface that allows you to upload spreadsheets and retrieve data.</p>
                  <hr className="my-2" />
                  <p className="lead">
                    {/* <Button size='lg' className='display-button' color="info" onClick={this.toggleShowHistory} >Edit History</Button> */}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {transaction_button}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Button size='lg' className='display-button' color="info" onClick={this.store_training_data} >Complete Simulation</Button>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Button size='lg' className='display-button' color="info" onClick={this.restart} >Restart Simulation</Button>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Button size='lg' className='display-button' color="info" onClick={this.toggleInstructionModal} >Instruction</Button>
                  </p>

                  <Modal size='lg' isOpen={this.state.isInstructionOpen} >
                    {/* <ModalHeader ><header>Simulation Instruction</header>  </ModalHeader> */}
                    <ModalBody>
                        <h2>Welcome</h2>
                        Welcome to Academic Simulation! This instruction can be accessed at any time by clicking the "Instruction" button on this webpage. 
                        Under this simulation, there are three tables: attendance table, gradebook table, and a student status table. This simulation has two parts.  
                        <hr className="my-2" />
                        
                        <p className="margin-one">
                        <h2>Part 1</h2>
                        Part 1 simulates a seven-day period. For each day from Monday to Friday, you are to fill our the attendance table and then the student status table. 
                        First, you will pretend it is a Monday, and you are to fill out the attendance table for Monday on all of your 
                        students. After taking the Monday's attendance, you will open up the student status table, and increment the number of tardies and 
                        absents for each student based on Monday's attendance in the following manner: First, 3 tardies count as 1 absent. For example, a student with 
                        4 tardies and 1 absent will be updated to have 1 tardy and 2 absent. Second, 3 absents result in a disciplinary action, so a student with 
                        3 absent and 1 disciplinary action will be updated to 1 absent and 2 disciplinary action. Third, update the status based on how many 
                        disciplinary action the student has. If the student has 1 disciplinary action, the status will be changed to "warning"; for 2 
                        disciplinary actions, the status will be "final warning"; for 3 disciplinary actions, the status will be "drop out". Next, you will pretend that 
                        the day is Tuesday, and you will need repeat the above procedures for this day. You need to complete the same procedures for each day from Monday to 
                        Friday. 
                        <h5>Note: </h5>
                        Make sure to follow the procedures day-by-day! That is, fill out Monday attendance, and the update student status; then fill our Tuesday attendance, and 
                        then update student status; then Wednesday attendance... etc. Do not jump ahead. 
                        </p>
                        <hr className="my-2" />

                        <h2>Part 2</h2>
                        In part 2, you need to log each students' grade into the grade book. The grades for each assignment for each individual student is included in the email
                        we sent you. If you did not get the email, please exit the simulation and contact ninghan2@illinois.edu. Note we are simulating the course progress in chronological 
                        order, where MP1 is due, and then MP2, then MP3, then MP4, then Lab1...etc. So, when filling out the gradebook, please make sure to fill out the table
                        assignment-by-assignment. That is. fill out all students' score for a particular assignment before moving to the next assignment. After filling out all the assignment, 
                        please calculate each students' final grade (by hand, since we don't support formula function here). The total score for the course is 1000 points, and the students' final
                        grade is in percentage. After filling out the grade book, you will go to the student status table and update it in the following manner. For each student that has a final 
                        grade less than 60%, update that student's status to "warning" if the student's current status is normal. If that student's current status is not normal, don't change anything
                        for that student. 

                    </ModalBody>
                    <ModalFooter>
                        <Button size='lg' className='display-button' color="info" onClick={this.load_tables}>Got it!</Button>
                    </ModalFooter>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isRedirectConfirmOpen} toggle={this.toggleRedirectConfirmModal}>
                    <ModalHeader toggle={this.toggleRedirectConfirmModal}>Are you sure you want to leave this page?</ModalHeader>
                    <ModalBody>
                      Note that once you leave this simulation page, you will lose all the records and progress on this simulation. 
                    </ModalBody>
                    <ModalFooter>
                    <Button size='lg' className='display-button' color="info" onClick={this.redirect}>Confirm</Button> {' '}
                    <Button size='lg' className='display-button' color="info" onClick={this.toggleRedirectConfirmModal}>Cancel</Button>
                    </ModalFooter>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isNameModalOpen} toggle={this.toggleNameModal}>
                    <ModalHeader toggle={this.toggleNameModal}>Please Enter Your Full Name</ModalHeader>
                    <ModalBody>
                      <Form onSubmit={this.submitName}>
                        <FormGroup>
                          <Label for="user_name">Enter Full Name</Label>
                          <Input type="text" name="name" id="name" onChange={e => this.onNameSubmit(e)} />
                        </FormGroup>
                        <Button size='lg' color="primary" className='single_search_submit' type="submit" >Confirm</Button> {' '}
                      </Form>
                    </ModalBody>
                  </Modal>

                  <Modal size='lg' isOpen={this.state.isRestartModalOpen} toggle={this.toggleRestartModal}>
                    <ModalHeader toggle={this.toggleRestartModal}>Please Enter Your Full Name</ModalHeader>
                    <ModalBody>
                      Your simulation has been restarted. All the changes that haven't been committed yet are clearned. 
                    </ModalBody>
                    <ModalFooter>
                      <Button size='lg' className='display-button' color="info" onClick={this.toggleRestartModal}>Got It</Button>
                    </ModalFooter>
                  </Modal>
                  
                        
            </Jumbotron>
        </div>
        {/* <hr /> */}

        <Nav tabs>
            <NavItem>
                <NavLink
                    className={classnames({ active: this.state.activeTab === '1' })}
                    onClick={() => { this.toggle('1'); }}>
                    Attendance Table
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink
                    className={classnames({ active: this.state.activeTab === '2' })}
                    onClick={() => { this.toggle('2'); }}>
                    Gradebook
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink
                    className={classnames({ active: this.state.activeTab === '3' })}
                    onClick={() => { this.toggle('3'); }}>
                    Student Status
                </NavLink>
            </NavItem>
        </Nav>
        <TabContent activeTab={this.state.activeTab}>
            <TabPane tabId="1">
                <h4>
                    Attendance
                </h4> 
                <div id = "display_portion" onScroll={e => this.track_action(e, "scroll")}  tabIndex="1">
                    <HotTable className="handsontable" id ="display_table" data={attendance_display} ref={this.hotTableComponent} id={this.id}
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
                    
            </TabPane>
            <TabPane tabId="2">
                <h4>
                    Gradebook
                </h4> 
                <div id = "display_portion" onScroll={e => this.track_action(e, "scroll")}  tabIndex="1">
                    <HotTable className="handsontable" id ="display_table" data={greadebook_display} ref={this.hotTableComponent1} id={this.id}
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
                    
            </TabPane>
            <TabPane tabId="3">
                <h4>
                    Student Status Table
                </h4> 
                <div id = "display_portion" onScroll={e => this.track_action(e, "scroll")}  tabIndex="1">
                    <HotTable className="handsontable" id ="display_table" data={student_status_display} ref={this.hotTableComponent2} id={this.id}
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
                    
            </TabPane>
        </TabContent>
          
      </div>

    );
  }
}
export default Academic;
