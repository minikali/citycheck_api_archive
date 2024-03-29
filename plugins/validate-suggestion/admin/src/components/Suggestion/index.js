import React, { useState, useEffect } from "react";
import { Textarea, Select, Button, Label } from "@buffetjs/core";
import { request } from "strapi-helper-plugin";
import Project from "../Project";

const translate = async (txt, destLang) => {
  try {
    const key = "trnsl.1.1.20200410T111243Z.09305873700877ce.821f1f457e4ac22fee5abcdfaeca67f5949e1c3f";
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    var urlencoded = new URLSearchParams();
    urlencoded.append("text", txt);

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    const response = await fetch(`https://translate.yandex.net/api/v1.5/tr.json/translate?key=${key}&lang=${destLang}`, requestOptions);
    const text = await response.text();
    if (!response.ok) throw new Error(text);
    return JSON.parse(text);
  } catch (err) {
    console.error(err);
    return null;
  };
};

const Suggestion = props => {
  const {
    id,
    phase,
    justify_fr,
    justify_en,
    french_project,
    english_project,
    created_at,
    user,
    validateSuggestion,
    deleteSuggestion,
  } = props;
  const [state, setState] = useState({
    justify_fr: justify_fr || "",
    justify_en: justify_en || "",
    phase
  });

  useEffect(() => {
    (async () => {
      if (!justify_en) {
        const justify = state.justify_fr && (await translate(state.justify_fr, "en")).text[0];
        setState({ ...state, justify_en: justify });
      } else {
        const justify = state.justify_en && (await translate(state.justify_en, "fr")).text[0];
        setState({ ...state, justify_fr: justify });
      }
    })();
  }, []);

  const translateToEn = async () => {
    const justify = (await translate(state.justify_fr, "en")).text[0];
    setState({ ...state, justify_en: justify });
  }

  const translateToFr = async () => {
    const justify = (await translate(state.justify_en, "fr")).text[0];
    setState({ ...state, justify_fr: justify });
  }

  const phases = [
    {
      label: "phase_1",
      value: 1
    },
    {
      label: "phase_2",
      value: 2
    },
    {
      label: "phase_3",
      value: 3
    }
  ];

  const handleSubmit = async () => {
    const res = await validateSuggestion({
      id,
      phase,
      french_project,
      english_project,
      user,
      ...state
    });
  };

  const handleDelete = () => {
    deleteSuggestion(id);
  };

  return (
    <div className={"container-fluid row"} style={{ padding: "18px 30px" }}>
      <div className={`col-6`}>
        <h2>{`Suggestion ID:${id}`}</h2>
        <p>{`by ${user && user.name ? `${user.name} [id:${user.id}]` : ""} `}</p>
        <p>{`Created at ${new Date(created_at).toLocaleDateString("fr-FR")}`}</p>

        <Label htmlFor="phase" style={{ marginTop: "10px" }}>Phase</Label>
        <Select
          name="phase"
          options={phases}
          value={state.phase}
          onChange={({ target: { value } }) => {
            setState({ ...state, phase: parseInt(value, 10) });
          }}
        />

        <Label htmlFor="Justify"
          style={{ marginTop: "10px" }}>
          Justify (fr)
            <Button
            style={{ margin: "12px auto 0px auto" }}
            label={"Translate"}
            onClick={() => {
              console.log(props.lang);
              translateToEn();
            }}
            style={{
              height: "15px",
              fontSize: "12px",
              marginLeft: "10px"
            }}
          />
        </Label>
        <Textarea
          id={`justify-${id}`}
          name={"justify"}
          placeholder={"No justify"}
          type={"text"}
          value={state.justify_fr}
          onChange={({ target: { value } }) => {
            setState({ ...state, justify_fr: value });
          }}
        />

        <Label htmlFor="Justify"
          style={{ marginTop: "10px" }}>
          Justify (en)
            <Button
            style={{ margin: "12px auto 0px auto" }}
            label={"Translate"}
            onClick={() => {
              console.log(props.lang);
              translateToFr();
            }}
            style={{
              height: "15px",
              fontSize: "12px",
              marginLeft: "10px"
            }}
          />
        </Label>
        <Textarea
          id={`justify-${id}`}
          name={"justify"}
          placeholder={"No justify"}
          type={"text"}
          value={state.justify_en}
          onChange={({ target: { value } }) => {
            setState({ ...state, justify_en: value });
          }}
        />

        <div className="row">
          <div className={"col-12"}>
            <Button
              style={{ margin: "12px auto 0px auto" }}
              label={"Validate"}
              onClick={() => {
                handleSubmit();
              }}
            />
            <Button
              style={{ margin: "12px auto 0px 10px" }}
              label={"Delete"}
              onClick={() => {
                handleDelete();
              }}
            />
          </div>
        </div>
      </div>
      <div className={"row"}>

      </div>
      <div className={`col-6`}>
        <Project
          id={french_project.id}
          title={french_project.title}
          created_at={french_project.created_at}
          description={french_project.description}
          phase={french_project.phase}
          address={french_project.address}
          userinfo={french_project.userinfo}
          justify={french_project.justify}
          phases={phases}
        />
      </div>
    </div>
  );
};

export default Suggestion;