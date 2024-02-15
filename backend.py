import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import nd2

print("Starting FastAPI server...")


app = FastAPI()


class FilePath(BaseModel):
    file_path: str


@app.post("/process/")
async def process_nd2_file(file_path: FilePath):
    if not os.path.exists(file_path.file_path) or not file_path.file_path.endswith(
        ".nd2"
    ):
        raise HTTPException(status_code=400, detail="Invalid file path or file type.")

    try:
        file_name = os.path.basename(file_path.file_path)
        file_size = os.path.getsize(file_path.file_path)
        metadata = extract_metadata(file_path.file_path)
        return {"file_name": file_name, "file_size": file_size, "metadata": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def extract_metadata(file_path: str):
    with nd2.ND2File(file_path) as nd2_file:
        # print(nd2_file.metadata)
        return nd2_file.metadata
