# QueueLess — Real-Time Queue Management App

**Skip the line. Save your time.**

QueueLess is a cross-platform mobile application designed to simplify queue management for customers and businesses. Customers can discover businesses, join queues remotely, track their token position, and receive notifications when their turn is approaching. Business owners and staff can manage daily queues, serve customers efficiently, and monitor queue activity.

The project is being developed using React Native, Expo, TypeScript, Node.js, Express.js, MongoDB, and Socket.IO.

## Overview

QueueLess aims to reduce the inconvenience of waiting in physical queues at clinics, salons, restaurants, banks, diagnostic centers, and other service businesses.

Instead of waiting at a counter, customers can join a queue through their mobile devices and monitor its progress. Businesses can organize customers through a digital queue system and update queue status in real time.

## Problem Statement

Traditional queue systems often require customers to wait physically without knowing how long the wait will take. Businesses may also find it difficult to organize customers, communicate queue progress, and analyze service performance.

QueueLess aims to address these problems through remote queue joining, digital tokens, real-time updates, and centralized queue management.

## Objectives

- Reduce unnecessary physical waiting.
- Provide transparent queue positions and waiting-time estimates.
- Help businesses organize daily customer queues.
- Notify customers when their turn is approaching.
- Support QR-code-based queue joining.
- Provide basic analytics to help businesses understand service activity.

## User Roles

### 1. Customer

- Register and log in.
- Discover nearby businesses and available services.
- Join queues remotely or scan a QR code.
- View token number, queue position, and estimated waiting time.
- Receive turn notifications.
- Leave active queues.
- View active queues and previous visits.
- Manage profile and notification preferences.

### 2. Business Owner

- Register and manage a business profile.
- Configure services and operating hours.
- Create and control daily queues.
- View waiting and completed customers.
- Call the next customer and update queue status.
- Generate and share QR codes.
- View customer and queue analytics.
- Manage staff accounts and permissions.

### 3. Business Staff

- Access assigned business queues.
- View waiting customers and token details.
- Call the next customer.
- Update customer service status.
- Mark customers as completed or skipped.
- Perform queue operations permitted by the business owner.

## Key Features

### Customer Features

- User authentication
- Business discovery and search
- Service selection
- Remote queue joining
- Digital token generation
- Live queue tracking
- QR-code scanning
- Turn notifications
- Queue history

### Business Features

- Business profile management
- Daily queue creation
- Queue opening, pausing, resuming, and closing
- Customer queue management
- Token status updates
- QR-code generation
- Staff access management
- Business analytics

### Real-Time Features

Socket.IO will be used to communicate queue changes between authorized customer and business applications. Queue updates will be persisted by the backend before being broadcast to connected clients.

## Technology Stack

| Category | Technologies |
|---|---|
| Mobile Application | React Native, Expo |
| Programming Language | TypeScript |
| Navigation | Expo Router |
| State Management | Zustand |
| API Communication | Axios, REST APIs |
| Real-Time Communication | Socket.IO |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, password hashing, role-based access control |
| QR Code | Expo Camera and a QR code library |
| Push Notifications | Expo Notifications |
| Version Control | Git, GitHub |
| API Testing | Postman |
| Testing | Vitest, Supertest, React Native Testing Library |

