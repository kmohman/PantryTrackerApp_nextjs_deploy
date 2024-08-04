'use client'

import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Modal, Typography, Stack, TextField, Button, Snackbar, Alert, Grid, Card, CardContent, CardActions, IconButton, Paper } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import { formatDistanceToNow, parseISO } from 'date-fns'
import { collection, deleteDoc, doc, getDocs, query, getDoc, setDoc } from 'firebase/firestore'

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
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

  const addItem = async (item, quantity, expirationDate) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity: currentQuantity, expiration } = docSnap.data()
      await setDoc(docRef, { quantity: currentQuantity + quantity, expiration: expirationDate || expiration })
    } else {
      await setDoc(docRef, { quantity, expiration: expirationDate })
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

  const increaseQuantity = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity, expiration } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1, expiration })
    }

    await updateInventory()
    setNotification({ open: true, message: 'Quantity increased successfully', severity: 'success' })
  }

  const decreaseQuantity = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity, expiration } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1, expiration })
      }
    }

    await updateInventory()
    setNotification({ open: true, message: 'Quantity decreased successfully', severity: 'info' })
  }

  const handleEdit = async (item) => {
    setEditItem(item)
    setItemName(item.name)
    setItemQuantity(item.quantity)
    setItemExpiration(item.expiration)
    setOpen(true)
  }

  const handleEditSubmit = async () => {
    if (editItem) {
      const docRef = doc(collection(firestore, 'inventory'), editItem.name)
      await deleteDoc(docRef)
      await addItem(itemName, itemQuantity, itemExpiration)
      setEditItem(null)
    } else {
      await addItem(itemName, itemQuantity, itemExpiration)
    }
    setItemName('')
    setItemQuantity(1)
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
    setItemQuantity(1)
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
              label="Quantity"
              type="number"
              variant="outlined"
              fullWidth
              value={itemQuantity}
              onChange={(e) => {
                setItemQuantity(parseInt(e.target.value))
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
        sx={{ mb: 2, bgcolor: 'white' }}
      />
      <Box
        width="80%"
        border="1px solid #333"
        borderRadius={1}
        overflow="auto"
        bgcolor="white"
        boxShadow={3}
        p={2}
        sx={{ maxHeight: '60vh' }}
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
              <Card sx={{ height: '100%', boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h5" color="textSecondary" gutterBottom>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Quantity: {quantity}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {expiration ? `Expires in ${formatDistanceToNow(parseISO(expiration))}` : 'No expiration date'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    color="primary"
                    onClick={() => increaseQuantity(name)}
                  >
                    <AddCircleIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => decreaseQuantity(name)}
                  >
                    <RemoveCircleIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => removeItem(name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit({ name, quantity, expiration })}
                  >
                    <EditIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box mt={2} display="flex" justifyContent="center" alignItems="center" gap={1}>
        <a href="https://www.linkedin.com/in/your-linkedin" target="_blank" rel="noopener noreferrer">
          <IconButton>
            <LinkedInIcon color="primary" />
          </IconButton>
        </a>
        <Typography>|</Typography>
        <a href="https://github.com/your-github" target="_blank" rel="noopener noreferrer">
          <IconButton>
            <GitHubIcon color="action" />
          </IconButton>
        </a>
      </Box>
    </Box>
  )
}
