import React, { useState, useEffect } from "react";
import {
  Box,
  useTheme,
  Grid,
  Button,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarQuickFilter,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { AiFillFire } from "react-icons/ai";
import { FaGun } from "react-icons/fa6";
import { VscBellDot } from "react-icons/vsc";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";

// Custom toolbar for the DataGrid
function CustomToolbar({ setFilterButtonEl }) {
  return (
    <Box sx={{ flexGrow: 1, borderRadius: "8px" }} backgroundColor={"#fefffe"}>
      <Toolbar variant="dense" disableGutters>
        <Box p={2} display={"flex"} alignItems={"center"}>
          <VscBellDot style={{ fontSize: "2rem" }} />

          <Typography variant="h6" p={2} fontWeight={"bold"}>
            All Notifications
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <GridToolbarContainer
          sx={{ p: 1, display: "flex", alignItems: "center" }}
        >
          <Box p={2}>
            <GridToolbarQuickFilter
              variant="outlined"
              size={"small"}
              sx={{ padding: "4", borderColor: "#DCDDDD", color: "#202020" }}
            />
          </Box>
          <Box p={2}>
            <GridToolbarFilterButton
              variant="outlined"
              sx={{
                padding: "4",
                height: "3.125em",
                borderColor: "#bcbdbd",
                color: "#202020",
                "&:hover": { borderColor: "black" },
              }}
              ref={setFilterButtonEl}
            />
          </Box>
        </GridToolbarContainer>
      </Toolbar>
    </Box>
  );
}

const Notifications = ({ changeWelcomeText }) => {
  const [notifications, setNotifications] = useState([]);
  const theme = useTheme();
  const colors = tokens;
  const [filterButtonEl, setFilterButtonEl] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleApprove = async () => {
    // Map over selectedRows to create an array of PUT requests
    const updatePromises = selectedRows.map(async (row) => {
      const updatedStatus = row.status === "Active" ? "Reviewed" : row.status;
      const updatedType = row.type === "Pending" ? "Verified" : row.type;

      const response = await fetch(
        `http://127.0.0.1:5000/auth/api/users/notifications/${row.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: updatedStatus, type: updatedType }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { ...row, status: updatedStatus, type: updatedType };
    });

    // Execute all the PUT requests
    Promise.all(updatePromises)
      .then((updatedRows) => {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => {
            const updatedRow = updatedRows.find(
              (row) => row && row.id === notification.id
            );
            return updatedRow || notification;
          })
        );

        // All PUT requests have completed successfully, now start POST requests
        const createIncidentPromises = selectedRows.map(async (row) => {
          const postData = {
            notification_id: row.id,
          };

          const postResponse = await fetch(
            "http://127.0.0.1:5000/auth/api/users/incidents",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(postData),
            }
          );

          if (!postResponse.ok) {
            throw new Error(`HTTP error! status: ${postResponse.status}`);
          }
          return postResponse.json(); // Assuming this resolves to an object with a 'success' property
        });

        // Wait for all incident POST requests to complete
        return Promise.all(createIncidentPromises);
      })
      .then((newIncidents) => {
        // Handle the new incidents here
        // setIncidents(currentIncidents => [...currentIncidents, ...newIncidents]);
      })
      .catch((error) => {
        console.error(
          "Error with updating notifications or creating incidents:",
          error
        );
      });
  };

  const handleDenyClick = async () => {
    // Map over selectedRows to create an array of PUT requests
    const updatePromises = selectedRows.map(async (row) => {
      const updatedStatus = "Reviewed"; // Directly set to 'Reviewed' for deny action
      const updatedType = "False Flag"; // Directly set to 'False Flag' for deny action

      const response = await fetch(
        `http://127.0.0.1:5000/auth/api/users/notifications/${row.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: updatedStatus, type: updatedType }),
        }
      );

      return response.ok
        ? { ...row, status: updatedStatus, type: updatedType }
        : null;
    });

    // Execute all the PUT requests and update the state once all are done
    Promise.all(updatePromises)
      .then((updatedRows) => {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => {
            const updatedRow = updatedRows.find(
              (row) => row && row.id === notification.id
            );
            return updatedRow ? updatedRow : notification;
          })
        );
      })
      .catch((error) => {
        console.error("Error updating notifications:", error);
      });
  };
  const handleIgnoreClick = async () => {
    // Map over selectedRows to create an array of PUT requests
    const updatePromises = selectedRows.map(async (row) => {
      const updatedStatus = "Reviewed";
      const updatedType = "Ignored";

      const response = await fetch(
        `http://127.0.0.1:5000/auth/api/users/notifications/${row.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: updatedStatus, type: updatedType }),
        }
      );

      return response.ok ? row.id : null; // Return the id of successfully updated rows
    });

    // Execute all the PUT requests and update the state once all are done
    Promise.all(updatePromises)
      .then((updatedRowIds) => {
        setNotifications((prevNotifications) =>
          prevNotifications.filter(
            (notification) => !updatedRowIds.includes(notification.id) // Remove ignored notifications from state
          )
        );
      })
      .catch((error) => {
        console.error("Error updating notifications:", error);
      });
  };

  const handleSelectionChange = (newSelectionModel) => {
    const selectedData = notifications.filter((row) =>
      newSelectionModel.includes(row.id)
    );
    setSelectedRows(selectedData);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/auth/api/users/notifications"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.notifications)) {
          setNotifications(result.notifications);
        } else {
          throw new Error("Invalid data structure");
        }
      } catch (error) {
        console.error("There was an error fetching notifications:", error);
      }
    };

    fetchNotifications();
    // Define the handler inside useEffect to capture the current state scope
    // Set up polling
    const pollingInterval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds

    // Clean up interval on component unmount
    return () => {
      clearInterval(pollingInterval);
    };
    const handleNewNotification = (notification) => {
      setNotifications((prevNotifications) => {
        const existingIndex = prevNotifications.findIndex(
          (n) => n.id === notification.id
        );
        if (existingIndex > -1) {
          return prevNotifications.map((item, index) =>
            index === existingIndex ? { ...item, ...notification } : item
          );
        } else {
          return [...prevNotifications, notification];
        }
      });
    };

    // // Define the event listener
    // socket.on("database_update", handleNewNotification);

    // // Cleanup the listener when the effect re-runs or the component unmounts
    // return () => {
    //   socket.off("database_update", handleNewNotification);
    // };
  }); // Dependencies array

  const columns = [
    // Define the columns for the DataGrid
    {
      field: "id",
      headerName: "ID",
      disableColumnMenu: true,
      cellClassName: "name-column--cell",
    },
    {
      field: "date",
      headerName: "Date/Time",
      flex: 1,
      disableColumnMenu: true,
      cellClassName: "name-column--cell",
    },
    {
      field: "type",
      headerName: "Type",
      type: "number",
      headerAlign: "left",
      align: "left",
      disableColumnMenu: true,
      cellClassName: "name-column--cell",
    },

    {
      field: "module",
      headerName: "Module",
      renderCell: (params) => (
        // Customize the rendering of the 'Module' column
        <div style={{ display: "flex", alignItems: "center" }}>
          {params.value}
          {params.value === "Fire Detection" && (
            <AiFillFire style={{ marginLeft: "4px", color: "#FFB133" }}>
              fire
            </AiFillFire>
          )}
          {params.value === "Weapon Detection" && (
            <FaGun style={{ marginLeft: "4px", color: "#FFB133" }}>fire</FaGun>
          )}
        </div>
      ),
      flex: 1,
      disableColumnMenu: true,
      cellClassName: "name-column--cell",
    },
    {
      field: "camera",
      headerName: "Camera Location",
      flex: 1,
      disableColumnMenu: true,
      cellClassName: "name-column--cell",
    },
    {
      field: "status",
      headerName: "Status",
      renderCell: (params) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              color:
                params.value === "Active"
                  ? "green"
                  : params.value === "Reviewed"
                  ? "blue"
                  : "inherit", // Use the default color if none of the conditions match
            }}
          >
            {params.value}
          </span>
        </div>
      ),
      flex: 1,
      disableColumnMenu: true,
      cellClassName: "name-column--cell",
    },
  ];
  return (
    <Box backgroundColor={colors.primary[500]} p={3} minHeight={"100vh"}>
      {/*GRID FOR THE CCTV FOOTAGE*/}
      <Box p={1}>
        <Box p={0}>
          {/*GRID CONTAINER 1 */}
          <Grid container spacing={2}>
            {/*GRID ITEM 1.1 */}
            <Grid item xs={12} sm={12} md={8} lg={6} xl={4}>
              <Box
                width="100%"
                backgroundColor={colors.secondary[500]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                border={"1px solid "}
              >
                {/*Insert the video / RTSP FEED HERE */}
                <img
                  src={"../../assets/vid-evidence.jpg"}
                  alt="sample"
                  style={{ maxWidth: "100%", height: "auto" }} // Controlling image dimensions
                />
              </Box>
            </Grid>

            {/*GRID ITEM 1.2 */}
            <Grid item xs={12} sm={12} md={8} lg={6} xl={4}>
              <Box
                backgroundColor={colors.secondary[500]}
                borderRadius="8px"
                height={"100%"}
              >
                <Box width="100%" display="flex" alignItems="left">
                  <Box p={5} color={colors.blackAccents[200]}>
                    <Typography variant="h6">Incident Type:</Typography>
                    <Typography variant="h6">Date:</Typography>
                    <Typography variant="h6">Room:</Typography>
                    <Typography variant="h6">Room:</Typography>
                    <Typography variant="h6">ID:</Typography>
                  </Box>
                  <Box p={5}>
                    <Typography variant="h6">Filler</Typography>
                    <Typography variant="h6">Filler</Typography>
                    <Typography variant="h6">Filler</Typography>
                    <Typography variant="h6">Filler</Typography>
                    <Typography variant="h6">Filler</Typography>
                  </Box>
                </Box>

                {/*Buttons*/}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-around" // To evenly space the buttons
                  paddingTop={5} // Adding padding for spacing
                  margin="auto" // Center horizontally and vertically
                >
                  <Button
                    variant="contained"
                    endIcon={<CheckIcon />}
                    onClick={handleApprove}
                    sx={{
                      backgroundColor: colors.orangeAccents[500],
                      color: colors.secondary[100],
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "10px 20px",
                      "&:hover": {
                        backgroundColor: colors.orangeAccents[400], // New color on hover
                      },
                    }}
                  >
                    Approve
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={<CloseIcon />}
                    onClick={handleDenyClick}
                    sx={{
                      backgroundColor: colors.orangeAccents[500],
                      color: colors.secondary[100],
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "10px 20px",
                      "&:hover": {
                        backgroundColor: colors.orangeAccents[400], // New color on hover
                      },
                    }}
                  >
                    Deny
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={<NotificationsOffIcon />}
                    onClick={handleIgnoreClick}
                    sx={{
                      backgroundColor: colors.orangeAccents[500],
                      color: colors.secondary[100],
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "10px 20px",
                      "&:hover": {
                        backgroundColor: colors.orangeAccents[400], // New color on hover
                      },
                    }}
                  >
                    Ignore
                  </Button>
                </Box>
              </Box>
            </Grid>
            {/*GRID ITEM 1.3 */}
            <Grid item xs={12} sm={12} md={8} lg={6} xl={4}>
              <Box
                width="100%"
                backgroundColor={colors.secondary[500]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                border={"1px solid "}
              >
                {/*Insert the video / RTSP FEED HERE */}
                <img
                  src={"../../assets/vid-evidence.jpg"}
                  alt="sample"
                  style={{ maxWidth: "100%", height: "auto" }} // Controlling image dimensions
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Box
        p={1}
        m="8px 0 0 0"
        width="100%"
        height="80vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            fontSize: "14px",
            "& .MuiDataGrid-cell:focus": {
              outline: "none", // Remove the focus outline
            },
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            backgroundColor: colors.secondary[500],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.secondary[500],
            borderBottom: "none",
            color: colors.blackAccents[300],
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "15px",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.secondary[500],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.secondary[500],
            borderRadius: "8px",
          },
          "& .MuiCheckbox-root": {
            color: `${colors.primary[500]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blackAccents[100]} !important`,
            fontSize: "14px",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(255, 87, 34, 0.3) !important",
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: `${colors.orangeAccents[500]} !important`,
          },
        }}
      >
        <DataGrid
          disableColumnSelector
          disableDensitySelector
          checkboxSelection
          onSelectionModelChange={handleSelectionChange}
          selectionModel={selectedRows.map((row) => row.id)}
          rows={notifications}
          columns={columns}
          components={{ Toolbar: CustomToolbar }}
          componentsProps={{
            panel: {
              anchorEl: filterButtonEl,
              placement: "bottom-end",
            },
            toolbar: {
              setFilterButtonEl,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Notifications;
