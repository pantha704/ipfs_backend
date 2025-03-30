import { create } from 'ipfs-http-client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Guide for setting up Pinata IPFS integration
//
// To use this module, you'll need to:
//
// 1. Create a Pinata account at https://pinata.cloud/
// 2. Generate API keys from your Pinata dashboard
// 3. Add your API keys to your .env file:
//    - PINATA_API_KEY
//    - PINATA_API_SECRET
//    - PINATA_JWT (optional, but recommended for more secure access)
//
// For more advanced usage, consider:
// - Using signed JWTs for frontend uploads
// - Implementing metadata for better content organization
// - Setting up dedicated gateways for faster content retrieval

// Configure the IPFS client with Pinata credentials
const auth = `Basic ${Buffer.from(
  `${process.env.PINATA_API_KEY}:${process.env.PINATA_API_SECRET}`
).toString('base64')}`

// Create and configure the IPFS client
const ipfs = create({
  host: 'api.pinata.cloud',
  port: 443,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
})

export default ipfs
