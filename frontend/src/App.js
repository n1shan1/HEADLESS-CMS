import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css"; // Importing the CSS file

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
});

function App() {
  const [entities, setEntities] = useState([]);
  const [name, setName] = useState("");
  const [attributes, setAttributes] = useState([]);
  const [newAttribute, setNewAttribute] = useState("");
  const [dataType, setDataType] = useState("string");
  const [entityAttributes, setEntityAttributes] = useState({});

  const fetchEntities = useCallback(() => {
    axiosInstance
      .get("/api/entities")
      .then((response) => {
        setEntities(response.data);
      })
      .catch((error) => {
        console.error("Error fetching entities:", error);
      });
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  useEffect(() => {
    entities.forEach((entity) => getAttributes(entity.id));
  }, [entities]);

  const handleCreateEntity = async () => {
    try {
      const entity = { name, attributes };
      await axiosInstance.post("/api/entities", entity);
      fetchEntities();
      setName("");
      setAttributes([]);
    } catch (error) {
      console.error("Error creating entity:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        if (error.response.status === 400) {
          alert("Bad request: Please check your input data.");
        } else if (error.response.status === 404) {
          alert("Not found: The requested resource was not found.");
        } else {
          alert("An error occurred while creating the entity.");
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response received from the server.");
      } else {
        console.error("Error in request:", error.message);
        alert("Error making the request.");
      }
    }
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: newAttribute, dataType }]);
    setNewAttribute("");
  };

  const handleDeleteAttribute = (index) => {
    const updatedAttributes = [...attributes];
    updatedAttributes.splice(index, 1);
    setAttributes(updatedAttributes);
  };

  const handleUpdateEntity = async (id, updatedName, updatedAttributes) => {
    const entity = { name: updatedName, attributes: updatedAttributes };
    await axiosInstance.put(`/api/entities/${id}`, entity);
    fetchEntities();
  };

  const handleDeleteEntity = async (id) => {
    await axiosInstance.delete(`/api/entities/${id}`);
    fetchEntities();
  };

  const handleCreateEntityObject = (id, attributesArray) => {
    const attributeData = {};
    attributesArray.forEach((attribute) => {
      console.log("attribute:", attribute);
      console.log("entity attributes:", entityAttributes);
      const inputData = prompt(
        `Enter data for ${attribute.name} (${attribute.dataType})`
      );
      const dataType =
        attribute.dataType === "date" ? "value_datetime" : "value_text";
      attributeData[dataType] = inputData;
      console.log("Value of value_text:", inputData);
      axiosInstance
        .post(`/api/entities/${id}/attributes/${attribute.id}/data`, {
          data: attributeData,
        })
        .then((response) => {
          console.log("Entity created successfully:", response.data);
          fetchEntities();
        })
        .catch((error) => {
          console.error("Error creating entity:", error);
        });
    });
  };

  const getAttributes = async (id) => {
    try {
      const response = await axiosInstance.get(
        `/api/entities/${id}/attributes`
      );
      console.log("response:", response);
      console.log("Attributes Response:", response.data);
      setEntityAttributes((prevState) => ({
        ...prevState,
        [id]: response.data,
      }));
    } catch (error) {
      console.error("Error fetching attributes of entity:", error);
    }
  };

  return (
    <div className="App">
      <h1>Basic Headless-CMS</h1>
      <div className="input-group">
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label>Add Attribute:</label>
        <input
          type="text"
          value={newAttribute}
          onChange={(e) => setNewAttribute(e.target.value)}
        />
        <select value={dataType} onChange={(e) => setDataType(e.target.value)}>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
        </select>
        <button onClick={handleAddAttribute}>Add Attribute</button>
      </div>
      <div>
        <h2>Entity Class:</h2>
        <ul>
          {attributes.map((attribute, index) => (
            <li key={index}>
              {attribute.name} - {attribute.dataType}
              <button onClick={() => handleDeleteAttribute(index)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={handleCreateEntity}>Create Entity</button>
      <hr />
      <h2>Entities</h2>
      <ul>
        {entities.map((entity) => (
          <li key={entity.id}>
            <div>
              {entity.name} - Attributes:
              <ul>
                {entityAttributes[entity.id]?.Attributes.map(
                  (attribute, index) => (
                    <li key={index}>
                      {attribute.name} ({attribute.dataType})
                    </li>
                  )
                )}
              </ul>
              <div className="entity-actions">
                <button
                  onClick={() =>
                    handleCreateEntityObject(
                      entity.id,
                      entityAttributes[entity.id]?.Attributes
                    )
                  }
                >
                  Create Object
                </button>
                <button
                  onClick={() =>
                    handleUpdateEntity(
                      entity.id,
                      prompt("Enter updated name"),
                      prompt("Enter updated attributes JSON")
                    )
                  }
                >
                  Update
                </button>
                <button onClick={() => handleDeleteEntity(entity.id)}>
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
