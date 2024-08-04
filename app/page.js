'use client'

import Image from "next/image";
import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Modal, Typography, Stack, TextField, Button, Snackbar, Alert, IconButton } from '@mui/material'
import { collection, deleteDoc, doc, getDocs, query, getDoc, setDoc } from 'firebase/firestore'
import EditIcon from '@mui/icons-material/Edit';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' })

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setInventory(inventoryList)
  }

  const addItem = async (item, expirationDate) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1, expirationDate })
    } else {
      await setDoc(docRef, { quantity: 1, expirationDate })
    }

    await updateInventory()
    setNotification({ open: true, message: 'Item added successfully', severity: 'success' })
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }

    await updateInventory()
    setNotification({ open: true, message: 'Item removed successfully', severity: 'info' })
  }

  const handleEdit = async (item) => {
    setEditItem(item)
    setItemName(item.name)
    setExpirationDate(item.expirationDate || '')
    setOpen(true)
  }

  const handleEditSubmit = async () => {
    if (editItem) {
      const docRef = doc(collection(firestore, 'inventory'), editItem.name)
      await deleteDoc(docRef)
      await addItem(itemName, expirationDate)
      setEditItem(null)
    } else {
      await addItem(itemName, expirationDate)
    }
    setItemName('')
    setExpirationDate('')
    setOpen(false)
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setEditItem(null)
    setItemName('')
    setExpirationDate('')
  }

  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false })
  }

  const getExpirationMessage = (expirationDate) => {
    const distance = formatDistanceToNow(parseISO(expirationDate), { addSuffix: false });
    return `Expires in ${distance}`;
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      p={2}
      sx={{
        backgroundImage: 'url(/Pantry-picture.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleNotificationClose}>
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: 'translate(-50%, -50%)',
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">{editItem ? 'Edit item' : 'Add item'}</Typography>
          <Stack width="100%" direction="column" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              label="Item Name"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value)
              }}
            />
            <TextField
              type="date"
              variant="outlined"
              fullWidth
              label="Expiration Date"
              value={expirationDate}
              onChange={(e) => {
                setExpirationDate(e.target.value)
              }}
            />
            <Button
              variant="contained"
              onClick={handleEditSubmit}
            >
              {editItem ? 'Update' : 'Add'}
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Add New Item
      </Button>
      <Box border="1px solid #333" borderRadius={1} overflow="hidden" bgcolor="white">
        <Box
          width="800px"
          height="100px"
          bgcolor="primary.main"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          <Typography variant="h4">
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow="auto" p={2}>
          {inventory.map(({ name, quantity, expirationDate }) => (
            <Box
              key={name}
              width="100%"
              minHeight="50px"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bgcolor='#fafafa'
              padding={2}
              borderRadius={1}
              boxShadow={1}
            >
              <Typography variant="h6" color="#333" textAlign="left">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h6" color="#333" textAlign="left">
                Quantity: {quantity}
              </Typography>
              <Typography variant="h6" color="#333" textAlign="left">
                {expirationDate ? getExpirationMessage(expirationDate) : 'No expiration date'}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleEdit({ name, quantity, expirationDate })}
                >
                  <EditIcon />
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => removeItem(name)}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
