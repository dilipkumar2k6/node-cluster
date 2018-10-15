const cluster = require('cluster');
const os = require('os');

// *** Make DB call
const numberOfUsersInDB = function () {
  this.count = this.count || 5;
  this.count = this.count * this.count;
  return this.count;
};

if (cluster.isMaster) {
  const cpus = os.cpus().length;
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }
  console.dir(cluster.workers, { depth: 0 });
  const updateWorkers = () => {
    const userCounts = numberOfUsersInDB();
    Object.values(cluster.workers).forEach(worker => {
      worker.send({ userCounts });
    });
  };
  updateWorkers();
  setInterval(updateWorkers, 1);

  cluster.on('exit', (worker, code, signal) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(`Worker ${worker.id} crashed, starting a new worker`);
      cluster.fork();
    }
  });

  process.on('SIGUSR2', () => {
    const workers = Object.values(cluster.workers());
    const restartWorker = workerIndex => {
      const worker = workers[workerIndex];
      if (!worker) {
        return;
      }
      worker.on('exit', () => {
        if (!worker.exitedAfterDiscount) return;
        cluster.fork().on('listening', () => {
          restartWorker(workerIndex + 1);
        });
      });
      worker.disconnect();
    };
    restartWorker(0);
  })

} else {
  require('./server')
}