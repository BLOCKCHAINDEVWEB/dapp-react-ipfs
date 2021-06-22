import pinataSDK from '@pinata/sdk'

export const pinata = pinataSDK(process.env.REACT_APP_PINATA_KEY, process.env.REACT_APP_PINATA_SECRET);

export default pinataSDK
