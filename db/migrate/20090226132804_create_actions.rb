class CreateActions < ActiveRecord::Migration
  def self.up
    create_table :actions do |t|
      t.references :game
      t.references :player
      t.integer :kind # 0 => pass, 1 => check, 2 => call, 3 => bet, 4 => raise
      t.string :type
      t.integer :value
      t.timestamp :created_at
    end
  end

  def self.down
    drop_table :actions
  end
end
