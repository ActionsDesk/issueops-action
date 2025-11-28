const wait = async (milliseconds: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(), milliseconds)
  })
}

export default wait
