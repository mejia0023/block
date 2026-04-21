
usuario@Win11Home22H2-256:/mnt/c/Users/Usuario/Documents/sw2_projects/P1/fabric/network/scripts$  echo 'export PATH=$HOME/fabric-samples/bin:$PATH' >> ~/.bashrc
usuario@Win11Home22H2-256:/mnt/c/Users/Usuario/Documents/sw2_projects/P1/fabric/network/scripts$   ./setup.sh
[SETUP] Generando material criptográfico...
ficct.edu.bo
[SETUP] Generando genesis block y canal...
2026-04-20 19:33:33.786 -04 0001 INFO [common.tools.configtxgen] main -> Loading configuration
2026-04-20 19:33:33.827 -04 0002 INFO [common.tools.configtxgen.localconfig] completeInitialization -> orderer type: etcdraft
2026-04-20 19:33:33.828 -04 0003 INFO [common.tools.configtxgen.localconfig] completeInitialization -> Orderer.EtcdRaft.Options unset, setting to tick_interval:"500ms" election_tick:10 heartbeat_tick:1 max_inflight_blocks:5 snapshot_interval_size:16777216
2026-04-20 19:33:33.828 -04 0004 INFO [common.tools.configtxgen.localconfig] Load -> Loaded configuration: /mnt/c/Users/Usuario/Documents/sw2_projects/P1/fabric/network/configtx.yaml
2026-04-20 19:33:34.365 -04 0005 INFO [common.tools.configtxgen] doOutputBlock -> Generating genesis block
2026-04-20 19:33:34.365 -04 0006 INFO [common.tools.configtxgen] doOutputBlock -> Creating system channel genesis block
2026-04-20 19:33:34.367 -04 0007 INFO [common.tools.configtxgen] doOutputBlock -> Writing genesis block
2026-04-20 19:33:34.589 -04 0001 INFO [common.tools.configtxgen] main -> Loading configuration
2026-04-20 19:33:34.624 -04 0002 INFO [common.tools.configtxgen.localconfig] Load -> Loaded configuration: /mnt/c/Users/Usuario/Documents/sw2_projects/P1/fabric/network/configtx.yaml
2026-04-20 19:33:34.624 -04 0003 INFO [common.tools.configtxgen] doOutputChannelCreateTx -> Generating new channel configtx
2026-04-20 19:33:35.187 -04 0004 INFO [common.tools.configtxgen] doOutputChannelCreateTx -> Writing new channel tx
2026-04-20 19:33:35.392 -04 0001 INFO [common.tools.configtxgen] main -> Loading configuration
2026-04-20 19:33:35.429 -04 0002 INFO [common.tools.configtxgen.localconfig] Load -> Loaded configuration: /mnt/c/Users/Usuario/Documents/sw2_projects/P1/fabric/network/configtx.yaml
2026-04-20 19:33:35.430 -04 0003 INFO [common.tools.configtxgen] doOutputAnchorPeersUpdate -> Generating anchor peer update
2026-04-20 19:33:35.734 -04 0004 INFO [common.tools.configtxgen] doOutputAnchorPeersUpdate -> Writing anchor peer update
[SETUP] Compilando chaincode TypeScript...

up to date, audited 83 packages in 4s

6 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

> evoting-chaincode@1.0.0 build
> tsc

src/evoting.contract.ts:69:26 - error TS2554: Expected 0 arguments, but got 1.

69     return data.toString('utf8');
                            ~~~~~~

src/evoting.contract.ts:80:41 - error TS2554: Expected 0 arguments, but got 1.

80     const voteId = voteIdBytes.toString('utf8');
                                           ~~~~~~

src/evoting.contract.ts:85:30 - error TS2554: Expected 0 arguments, but got 1.

85     return voteData.toString('utf8');
                                ~~~~~~

src/evoting.contract.ts:106:44 - error TS2554: Expected 0 arguments, but got 1.

106       tally = JSON.parse(existing.toString('utf8')) as TallyAsset;
                                               ~~~~~~


Found 4 errors in the same file, starting at: src/evoting.contract.ts:69

usuario@Win11Home22H2-256:/mnt/c/Users/Usuario/Documents/sw2_projects/P1/fabric/network/scripts$

