import { PrismaClient } from '@prisma/client'
import express from 'express'
import { PinataSDK } from 'pinata'
import web3 from 'web3'
import { ethers } from 'ethers'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

const prisma = new PrismaClient()
const app = express()

// Configure CORS with more specific options
app.use(
  cors({
    origin: '*', // Allow all origins - for development only
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// Middleware
app.use(express.json())

// Routes
app.post('/upload-file', async (req: any, res: any) => {
  try {
    const { file } = req.body
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

    const gatewayUrl = `https://${process.env.GATEWAY_URL}/ipfs/${fileHash}`

    const response = await fetch(gatewayUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const fileData = await response.arrayBuffer()

    res.set(
      'Content-Type',
      response.headers.get('Content-Type') || 'application/octet-stream'
    )

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
