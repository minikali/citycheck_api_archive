import React, { useState } from "react";
import { Textarea, Select, Button, Label } from "@buffetjs/core";
import { request } from "strapi-helper-plugin";

const Suggestion =
  ({
    suggestion,
    phases,
    projectId,
    validateSuggestion,
    deleteSuggestion
  }) => {
    const [show, setShow] = useState(true);
    const [state, setState] = useState({
      id: suggestion.id,
      justify: suggestion.justify,
      phase: suggestion.phase
    });
    // const { id, justify, phase, createdAt, userinfo } = suggestion;

    return (
      show && <div className={"container-fluid"} style={{ padding: "18px 30px" }}>
        <h2>{`Suggestion id ${suggestion.id}`}</h2>
        <p>{`Suggested by ${suggestion.userinfo.username} [id:${suggestion.userinfo.id}]`}</p>
        <Label htmlFor="phase" style={{ marginTop: "10px" }}>Phase</Label>
        <Select
          name="phase"
          options={phases}
          value={state.phase}
          onChange={({ target: { value } }) => {
            setState({ ...state, phase: parseInt(value, 10) });
          }}
        />
        <Label htmlFor="Justify" style={{ marginTop: "10px" }}>Justify</Label>
        <Textarea
          id={`justify-${suggestion.id}`}
          name={"justify"}
          placeholder={"No justify"}
          type={"text"}
          value={state.justify}
          onChange={({ target: { value } }) => {
            setState({ ...state, justify: value });
          }}
        />
        <div className="row">
          <div className={"col-12"}>
            <Button
              style={{ margin: "12px auto 0px auto" }}
              label={"Validate"}
              onClick={() => {
                const response = validateSuggestion(state);
                setShow(response ? false : true);
              }}
            />
            <Button
              style={{ margin: "12px auto 0px 10px" }}
              label={"Delete"}
              onClick={() => {
                const response = deleteSuggestion(suggestion.id);
                setShow(response ? false : true);
              }}
            />
          </div>
        </div>
      </div>
    );
  };

export default Suggestion;