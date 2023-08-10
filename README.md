# ChatGPT 100% descentralizado
ChatGPT en Blockchain es la vanguardia de la libertad de información, creando una plataforma de inteligencia artificial completamente descentralizada, transparente e inmune a la censura.

El Machine-learning con Zero-Knowledge es demasiado lento para esto. Si un chat de inteligencia artificial tarda entre 1 y 10 segundos en responder, con Zero-Knowledge tardaría entre 10 minutos y 2 horas en responder!!

En su lugar, utilizamos un enfoque completamente diferente, la Blockchain: Tenemos múltiples nodos que ejecutan el MISMO modelo de IA determinístico y utilizamos un Smart-Contract para verificar que la salida de todos los nodos sea la misma.

Luego, el Smart-Contract utiliza un mecanismo de consenso para encontrar el resultado más popular.

De esta manera, los nodos que dan una salida incorrecta son castigados, y aquellos con una salida correcta son recompensados por su trabajo honesto.

Esto permite correr chat de IA completamente descentralizado, que funciona en la Blockchain EN TIEMPO REAL, y que no puede ser censurado ni desactivado.

## Cómo funciona
Usamos huggingface para crear un modelo de lenguaje grande (como GPT2 o Alpaca) que luego subimos a IPFS.

La webapp siempre apunta a esta URL de ipfs para hacer uso de este modelo. Cuando un usuario escribe un mensaje, primero se sube a ipfs también, y la URL se envía a un contrato inteligente, junto con la URL del modelo.

Múltiples nodos están escuchando el evento TaskAdded del contrato inteligente, y descargan tanto el modelo como el mensaje de ipfs. Una vez descargados, ejecutan la inferencia (prediciendo la salida) de manera determinística.

Luego se suben cada una de las URLs de salida al Smart-Contract, que determinará cuál es la URL/resultado más popular.

Las URLs en ipfs se crean en base a un hash de su contenido, y por lo tanto, para que todos los nodos produzcan la misma URL, necesitan haber creado el mismo contenido.

Finalmente, el contrato inteligente utiliza un simple mecanismo de consenso para recompensar a los nodos que subieron la URL de salida correcta y castigar a aquellos con una URL incorrecta.

La aplicación web luego descarga el archivo de salida de ipfs y muestra la respuesta al usuario.
