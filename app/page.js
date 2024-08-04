'use client'

import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Modal, Typography, Stack, TextField, Button, Snackbar, Alert, Grid, Card, CardContent, CardActions, IconButton } from '@mui/material'
import { collection, deleteDoc, doc, getDocs, query, getDoc, setDoc } from 'firebase/firestore'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { formatDistanceToNow, parseISO } from 'date-fns'

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemExpiration, setItemExpiration] = useState('')
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
    setFilteredInventory(inventoryList)
  }

  const addItem = async (item, expirationDate) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity, expiration } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1, expiration: expirationDate || expiration })
    } else {
      await setDoc(docRef, { quantity: 1, expiration: expirationDate })
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
    setItemExpiration(item.expiration)
    setOpen(true)
  }

  const handleEditSubmit = async () => {
    if (editItem) {
      const docRef = doc(collection(firestore, 'inventory'), editItem.name)
      await deleteDoc(docRef)
      await addItem(itemName, itemExpiration)
      setEditItem(null)
    } else {
      await addItem(itemName, itemExpiration)
    }
    setItemName('')
    setItemExpiration('')
    setOpen(false)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query === '') {
      setFilteredInventory(inventory)
    } else {
      const filtered = inventory.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      setFilteredInventory(filtered)
    }
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setEditItem(null)
    setItemName('')
    setItemExpiration('')
  }

  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false })
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
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
              label="Item Name"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value)
              }}
            />
            <TextField
              label="Expiration Date"
              type="date"
              variant="outlined"
              fullWidth
              value={itemExpiration}
              onChange={(e) => {
                setItemExpiration(e.target.value)
              }}
              InputLabelProps={{
                shrink: true,
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
      <TextField
        label="Search Items"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Box
        width="80%"
        border="1px solid #333"
        borderRadius={1}
        overflow="hidden"
        bgcolor="white"
        boxShadow={3}
      >
        <Box
          width="100%"
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
        <Grid container spacing={2} p={2}>
          {filteredInventory.map(({ name, quantity, expiration }) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" color="textSecondary" gutterBottom>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Quantity: {quantity}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {expiration ? `Expires in ${formatDistanceToNow(parseISO(expiration))}` : 'No expiration date'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit({ name, quantity, expiration })}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => removeItem(name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}
