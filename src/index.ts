import { PrismaClient } from '@prisma/client'
import express from 'express'
import { PinataSDK } from 'pinata'
import web3 from 'web3'
import { ethers } from 'ethers'

const prisma = new PrismaClient()
const app = express()

// Middleware
app.use(express.json())

// Routes
app.post('/upload-file', async (req: any, res: any) => {
  try {
    const { file } = req.body
    // // Convert base64 to buffer
    // const fileBuffer = Buffer.from(file, 'base64')

    // Create a File object directly from the buffer for Pinata SDK
    // This avoids the Blob type error by skipping the Blob creation step
    const fileName = req.body.fileName || 'uploaded-file.json'
    const fileType = req.body.fileType || 'application/json'
    const fileObject = new File([JSON.stringify(file)], fileName, {
      type: fileType,
    })

    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.GATEWAY_URL,
    })
    const walletAddress = await ethers.Wallet.createRandom().getAddress()

    // Use the correct method from Pinata SDK
    const result = await pinata.upload.public.file(fileObject)
    prisma.content.create({
      data: {
        title: fileName,
        tags: ['test'],
        user: {
          connect: {
            walletAddress: walletAddress,
          },
        },
      },
    })
    res.json(result)
  } catch (error) {
    console.error('Error uploading file:', error)
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/get-file', async (req: any, res: any) => {
  const fileHash = req.query.fileHash as string
  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.GATEWAY_URL,
  })
  try {
    if (!fileHash) {
      return res.status(400).json({ error: 'File hash is required' })
    }

    // Construct the gateway URL manually
    const gatewayUrl = `https://${process.env.GATEWAY_URL}/ipfs/${fileHash}`
    // https://bronze-wrong-aardvark-644.mypinata.cloud/ipfs/

    // Fetch the file from the gateway
    const response = await fetch(gatewayUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    // Get the raw data instead of trying to parse JSON
    const fileData = await response.arrayBuffer()

    // Set appropriate headers based on content type
    res.set(
      'Content-Type',
      response.headers.get('Content-Type') || 'application/octet-stream'
    )

    // Send the raw file data
    // For JSON data, you could parse it first if needed
    // const jsonData = JSON.parse(Buffer.from(fileData).toString());
    // res.json(jsonData);

    // Parse buffer to JSON and send as JSON response
    const jsonData = JSON.parse(Buffer.from(fileData).toString())
    res.json(jsonData)
  } catch (error) {
    console.error('Error retrieving file:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
