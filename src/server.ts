import express from 'express'
import ipfs from './config' // Import from the correct file
const app = express()

app.use(express.json())

// Endpoint to store data on IPFS via Filebase
app.post('/store', async (req: any, res: any) => {
  try {
    const { data } = req.body
    if (!data) {
      return res.status(400).json({ error: 'No data provided' })
    }

    // Add the data to IPFS
    const result = await ipfs.add(data)
    // result.path contains the IPFS hash
    console.log('Data stored on Filebase IPFS with hash:', result.path)

    res.json({ ipfsHash: result.path })
  } catch (error: unknown) {
    console.error('Error storing data on Filebase IPFS:', error)
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
