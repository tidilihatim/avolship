import React from 'react'
import CallCenterQueueComp from '../_components/call-center-queue'
import { Metadata } from 'next'

export const metadata:Metadata = {
  title:"Queue | Avolship"
}

const CallCenterQueue = async () => {
 
  return (
    <div>
       <CallCenterQueueComp />
    </div>
  )
}

export default CallCenterQueue