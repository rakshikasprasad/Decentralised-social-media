import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'
import {create} from 'ipfs-http-client'

//const ipfsClient = require('ipfs-http-client')
//const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values
const INFURA_ID = 'your_project_id';
const INFURA_SECRET_KEY = 'your_secret_key';
const authorization = "Basic " + btoa(INFURA_ID + ":" + INFURA_SECRET_KEY);

const ipfs = create({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers:{
    authorization
  }
})


class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    //network id
    const networkId = await web3.eth.net.getId()
    const networkData = Decentragram.networks[networkId]
    if(networkData){
      const decentragram = web3.eth.Contract(Decentragram.abi,networkData.address)
      this.setState({decentragram: decentragram})
      
      const imagesCount = await decentragram.methods.imageCount().call()
      this.setState({imagesCount})
    //load images
    for (var i = 1; i <= imagesCount; i++) {
      const image = await decentragram.methods.images(i).call()
      this.setState({
        images: [...this.state.images, image]
        
      })
      console.log(this.state.images)
    }
    
      this.setState({loading: false})
    } else {
        window.alert('Decentragram contract not deployed to detected network.')
    }
    //console.log(accounts)
  }

  captureFile = event => {

    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  uploadImage = async description => {
    console.log("Submitting file to ipfs...")
    try{
       const added = await ipfs.add(this.state.buffer)
       console.log(added)
       this.setState({ loading: true })
       const web3 = window.web3
       // Load account
       const accounts = await web3.eth.getAccounts()
       this.setState({account: accounts[0]})
       //network id
       const networkId = await web3.eth.net.getId()
       const networkData = Decentragram.networks[networkId]
       const decentragram = web3.eth.Contract(Decentragram.abi,networkData.address)
       const image = await decentragram.methods.images(0).call()
       this.state.decentragram.methods.uploadImage(added.path, description).send({ from: this.state.account }).on('transactionHash', (path) => {
        added.author = this.state.account
        added.tipAmount = 0
        this.setState({
          images : [...this.state.images, added],
          loading : false
        })
      })
    }catch(error){
       console.log(error)         
}

}


// uploadImage = description => {
//   console.log("Submitting file to ipfs...")

//   //adding file to the IPFS
//   ipfs.add(this.state.buffer, (error, result) => {
//     console.log('Ipfs result', result)
//     if(error) {
//       console.error(error)
//       return
//     }

//     this.setState({ loading: true })
//     this.state.decentragram.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
//       this.setState({ loading: false })
//     })
//   })
// }


  /*uploadImage = description => {
    console.log("Submitting file to ipfs...")
    try {
      const added = await client.add(file)
      const url = `https://yourdedicatedgwname.infura-ipfs.io/ipfs/${added.path}`
      ipfs.add(this.state.buffer, (error, result) => {
        console.log('Ipfs result', result)
    } 
  } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  })

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      
      const url = `https://decentragram1.infura-ipfs.io/ipfs/${this.state.buffer.path}`
      console.log('Ipfs result', result)
      if(error) {
        console.error(error)
        return
      }

      //this.setState({ loading: true })
      //this.state.decentragram.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
      //this.setState({ loading: false })
      //})
    })*/

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      decentragram: null,
      images: [],
      loading: true,
    }
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
            images = {this.state.images}
            captureFile = {this.captureFile}
            uploadImage = {this.uploadImage}
            />
          }
      </div>
    );
  }
}

export default App;