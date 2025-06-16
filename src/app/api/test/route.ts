// src/app/api/test/generate-orders/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkForDuplicateOrders } from '@/lib/duplicate-detection/duplicate-checker';


export async function POST () {
  const check = await checkForDuplicateOrders({
    customer:{
      name:"My customer 1",
      phoneNumbers:["34529323"],
      shippingAddress:"my shipping"
    },
    products:[
      {
        productId:"productID1",
        quantity:1,
        unitPrice:34
      }
    ],
    totalPrice: 34,
    warehouseId:"dkfjdf",
    sellerId:"dddd",
    orderDate: new Date(),
  })

  return NextResponse.json(check)
}