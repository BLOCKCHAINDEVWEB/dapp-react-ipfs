
import React, { useState, useCallback } from 'react'
import { Table, Container, Button, Form } from 'react-bootstrap'

import web3 from './web3'
import ipfs from './ipfs'
import pinataSDK, { pinata } from './pinata'
import abi from './abis/Ipfs.json'
import './App.css'


const App = () => {
  const [isConnectedWeb3, setIsConnectedWeb3] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [state, setState] = useState({
    ipfsHash: '',
    buffer: '',
    ethAddress: '',
    txHash: '',
    txReceipt: {},
    blockNumber: '',
    gasUsed: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // connect to Ethereum wallet
  const connectToWeb3 = useCallback(async () => {
    if(window.ethereum) {
      try {
        const resp = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccounts([resp][0].concat(accounts))
        
        setIsConnectedWeb3(true)
      } catch (err) {
        console.log(err)
      }
    } else {
      alert("Install Metamask")
    }
  }, [accounts])

  // connect to Smart Contract
  const address = '0xf5e5984c3cfE123a1A7dA46dD9dC9d3E4fB89dc6'
  const storageContract = new web3.eth.Contract(abi, address)

  // obtain image file
  const captureFile = e => {
    const file = e.target.files[0]
    setInputValue(e.target.value)
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => convertToBuffer(reader)
  }

  // file is converted to a buffer to prepare for uploading to IPFS
  const convertToBuffer = async reader => {
    const buffer = await Buffer.from(reader.result)
    setState(state => ({ ...state, buffer }))
  }

  const onSubmit = async e => {
    e.preventDefault();

    setIsLoading(true)
    try {
      const ethAddress = await storageContract.options.address
      setState(state => ({ ...state, ethAddress }))

      const sendHash = async ipfdHash => {
        const txReceipt = await storageContract.methods.sendHash(ipfdHash).send({ from: accounts[0] })
        console.log(txReceipt)
        setState(state => ({ ...state, txReceipt: txReceipt }))
        setState(state => ({ ...state, txHash: txReceipt.transactionHash }))
        setState(state => ({ ...state, blockNumber: txReceipt.blockNumber }))
        setState(state => ({ ...state, gasUsed: txReceipt.gasUsed }))
        setIsLoading(false)
      }

      const pinHash = async ipfsHash => {
        console.log(ipfsHash)
        console.log(await pinata.testAuthentication())

        try {
          const resp = await pinata.pinByHash(ipfsHash)
          console.log(resp)
        } catch (err) {
          console.log(err)
        }
      }

      const result = await ipfs.add(state.buffer)
      const ipfsHash = result[0].hash
      sendHash(ipfsHash)
      pinHash(ipfsHash)
      setState(state => ({ ...state, ipfsHash: `https://ipfs.io/ipfs/${ipfsHash}` }))

      setInputValue('')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1> Ethereum and InterPlanetary File System(IPFS) with Create React App</h1>
        {isConnectedWeb3
          ? <p>Connected</p>
          : <button onClick={connectToWeb3}>Connect to web3</button>
        }
      </header>
      <hr />
      <Container>
        <h3> Choose file to send to IPFS </h3>
        <Form onSubmit={onSubmit}>
          <input type="file" value={inputValue} onChange={captureFile} />
          <Button type="submit">
            Send it 
          </Button>
        </Form>
        {state.txHash !== ''
          ? (<img
              src={state.ipfsHash}
              value={inputValue}
              alt="from ipfs"
              width="200"
              height="200"
            />)
          : isLoading
            ? <span className="wait">Waitting ...</span>
            : ''
        }
        <hr/>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Tx Receipt Category</th>
              <th>Values</th>
            </tr>
          </thead>
        
          <tbody>
            <tr>
              <td>IPFS Hash # stored on Eth Contract</td>
              <td>{state.ipfsHash}</td>
            </tr>
            <tr>
              <td>Ethereum Contract Address</td>
              <td>{state.ethAddress}</td>
            </tr>
            <tr>
              <td>Tx Hash</td>
              <td>{state.txHash}</td>
            </tr>
            <tr>
              <td>Block Number</td>
              <td>{state.blockNumber}</td>
            </tr>
            <tr>
              <td>Gas Used</td>
              <td>{state.gasUsed}</td>
            </tr>
          </tbody>
        </Table>
    </Container>
  </div>
  );
}

export default App
