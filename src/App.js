
import React, { useState, useCallback } from 'react'
import { Table, Container, Button, Form } from 'react-bootstrap'
import InputDataDecoder from 'ethereum-input-data-decoder'

import web3 from './web3'
import ipfs from './ipfs'
import { pinata } from './pinata'
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
    gasUsed: '',
    datasJSON: {}
  })
  const [isLoading, setIsLoading] = useState(false)
  const [dataOwner, setDataOwner] = useState({
    emailOwner: '',
    addressOwner: '',
    ipfsImgHash: ''
  })

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
  const decoder = new InputDataDecoder(abi)

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
    setState(state => ({ ...state, buffer: buffer }))
  }

  const onSubmit = async e => {
    e.preventDefault();

    setIsLoading(true)
      const ethAddress = await storageContract.options.address
      setState(state => ({ ...state, ethAddress: ethAddress }))

      const pinImgHash = async ipfsHash => {
        try {
          const resp = await pinata.pinByHash(ipfsHash)
          console.log(resp)
          return resp
        } catch (err) {
          console.log(err)
        }
      }

      const pinJSONHash = async jsonDatas => {
        try {
          const resp = await pinata.pinJSONToIPFS(jsonDatas)
          console.log(resp)
          return resp
        } catch (err) {
          console.log(err)
        }
      }

      const sendDataHash = async dataOwner => {
        const fetchIpfsHash = async inputData => {
          const resp = await fetch(`https://ipfs.io/ipfs/${inputData}`)
          return await resp.json()
        }

        try {
          const txReceipt = await storageContract.methods.sendHash(dataOwner).send({ from: accounts[0] })
          console.log(txReceipt)
          setState(state => ({ ...state, txReceipt: txReceipt }))
          setState(state => ({ ...state, txHash: txReceipt.transactionHash }))
          setState(state => ({ ...state, blockNumber: txReceipt.blockNumber }))
          setState(state => ({ ...state, gasUsed: txReceipt.gasUsed }))
          

          const txHash = txReceipt.transactionHash
          const txData = await web3.eth.getTransaction(txHash, 0)
          const inputData = decoder.decodeData(txData.input).inputs[0]
          console.log(inputData)

          const jsonIpfsDatas = await fetchIpfsHash(inputData)
          console.log(jsonIpfsDatas)
          setState(state => ({ ...state, datasJSON: jsonIpfsDatas }))
          
          setIsLoading(false)
          return jsonIpfsDatas
        } catch (err) {
          console.log(err)
        }
      }

    try {
      const respImgHash = await ipfs.add(state.buffer)
      const ipfsImgHash = respImgHash[0].hash
      pinImgHash(ipfsImgHash)
      setDataOwner(state => ({ ...state, ipfsImgHash: `https://ipfs.io/ipfs/${ipfsImgHash}` }))

      const jsonDatas = {
        'emailOwner': `${dataOwner.emailOwner}`,
        'addressOwner': `${dataOwner.addressOwner}`,
        'ipfsImgHash': `https://ipfs.io/ipfs/${ipfsImgHash}`
      }

      const respJsonHash = await ipfs.add(Buffer.from(JSON.stringify(jsonDatas)))
      const ipfsJsonHash = respJsonHash[0].hash
      sendDataHash(ipfsJsonHash)
      pinJSONHash(jsonDatas)

      setState(state => ({ ...state, ipfsHash: ipfsJsonHash }))
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
      <Form onSubmit={onSubmit}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="emailOwner"
            placeholder="Enter email"
            onChange={e => setDataOwner({ ...dataOwner, emailOwner: e.target.value } )}
          />
          <Form.Text className="text-mutes">Votre email est public.</Form.Text>
          <br />
          <Form.Label>Addresse public</Form.Label>
          <Form.Control
            size="sm"
            type="text"
            name="addressOwner"
            placeholder="0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
            onChange={e => setDataOwner({ ...dataOwner, addressOwner: e.target.value } )}
          />
        </Form.Group>
        <br />
        <Form.Group>
          <Form.Label>Choisir un fichier d'image de présentation</Form.Label>
          <Form.File
            type="file"
            value={inputValue}
            onChange={captureFile}
          />
        </Form.Group>
        <br />
        <Button type="submit" variant="primary">Envoyer</Button>
      </Form>
      <br />
      <Container>
        {state.txHash !== ''
          ? (<img
              src={dataOwner.ipfsImgHash}
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
              <th width="100" >Tx Receipt Category</th>
              <th maxWidth="400" >Values</th>
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
            <tr>
              <td>Input Data (decoded)</td>
              <td><pre>{JSON.stringify(state.datasJSON)}</pre></td>
            </tr>
          </tbody>
        </Table>
    </Container>
  </div>
  );
}

export default App
