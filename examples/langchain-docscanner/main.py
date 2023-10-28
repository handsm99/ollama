import gradio as gr

import sys
import os
from collections.abc import Iterable

from langchain.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader, UnstructuredHTMLLoader

from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter

from langchain.chains import RetrievalQA

from langchain.llms import Ollama

from langchain.vectorstores import FAISS, Chroma

from langchain.embeddings import GPT4AllEmbeddings, CacheBackedEmbeddings

from langchain.storage import LocalFileStore#, RedisStore, UpstashRedisStore, InMemoryStore

ollama = Ollama(base_url='http://localhost:11434',
#model="codellama")
#model="starcoder")
model="llama2")

docsUrl = "/home/user/dev/docs"

documents = []
for file in os.listdir(docsUrl):

    if file.endswith(".pdf"):
        pdf_path = docsUrl + "/" + file
        loader = PyPDFLoader(pdf_path)
        documents.extend(loader.load())
        print("Found " + pdf_path)
    elif file.endswith('.docx') or file.endswith('.doc'):
        doc_path = docsUrl + "/" + file
        loader = Docx2txtLoader(doc_path)
        documents.extend(loader.load())
        print("Found " + doc_path)
    elif file.endswith('.txt') or file.endswith('.kt') or file.endswith('.json'):
        text_path = docsUrl + "/" + file
        loader = TextLoader(text_path)
        documents.extend(loader.load())
        print("Found " + text_path)        
    elif file.endswith('.html') or file.endswith('.htm'):
        htm_path = docsUrl + "/" + file
        loader = UnstructuredHTMLLoader(htm_path)
        documents.extend(loader.load())
        print("Found " + htm_path)        


text_splitter = CharacterTextSplitter(chunk_size=32, chunk_overlap=32)
all_splits = text_splitter.split_documents(documents)



#fs = LocalFileStore("/home/gabriele/dev/cache/")

#underlying_embeddings = GPT4AllEmbeddings()
#cached_embedder = CacheBackedEmbeddings.from_bytes_store(
#    underlying_embeddings, fs, namespace=underlying_embeddings.model
#)



vectorstore = Chroma.from_documents(documents=all_splits, embedding=GPT4AllEmbeddings(embeddings_chunk_size=1000))
#vectorstore = FAISS.from_documents(documents=all_splits, embedding=cached_embedder)


def AI_response(question, history):
    docs = vectorstore.similarity_search(question)
    len(docs)
    qachain=RetrievalQA.from_chain_type(ollama, retriever=vectorstore.as_retriever())
    #reply=qachain()    
    #reply=str(qachain({"query": question}))
    reply=str(qachain.run(question))
    return reply



demo = gr.ChatInterface(AI_response, title="Put your files in folder" + docsUrl)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

